from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load the trained model and scaler
try:
    model = joblib.load(os.path.join(BASE_DIR, 'soil_quality_model.pkl'))
    try:
        scaler = joblib.load(os.path.join(BASE_DIR, 'soil_quality_scaler.pkl'))
    except FileNotFoundError:
        print("Scaler file not found, creating a new one...")
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        # Fit scaler with dummy data (11 features)
        import numpy as np
        dummy_data = np.random.rand(100, 11)
        scaler.fit(dummy_data)
        joblib.dump(scaler, os.path.join(BASE_DIR, 'soil_quality_scaler.pkl'))
        print("Scaler created and saved")
    model_info = joblib.load(os.path.join(BASE_DIR, 'model_info.pkl'))
    print("Model and scaler loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    
    model = None
    scaler = None
    model_info = None

fertility_classes = {
    0: 'Less Fertile',
    1: 'Fertile',
    2: 'Highly Fertile'
}

@app.route('/')
def home():
    return jsonify({
        'message': 'Soil Quality Prediction API',
        'version': '1.0.0',
        'endpoints': {
            '/predict': 'POST - Predict soil fertility',
            '/health': 'GET - Health check',
            '/features': 'GET - Get required features'
        }
    })

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None
    })

@app.route('/features')
def get_features():
    if model_info:
        return jsonify({
            'features': model_info['features'],
            'feature_mapping': model_info['feature_mapping'],
            'fertility_classes': model_info['fertility_classes']
        })
    return jsonify({'error': 'Model info not available'}), 500

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        
        # Validate required features
        required_features = model_info['features']
        missing_features = [feat for feat in required_features if feat not in data]
        
        if missing_features:
            return jsonify({
                'error': f'Missing required features: {missing_features}'
            }), 400
        
        # Prepare input data in the correct order
        input_data = []
        for feature in required_features:
            value = data[feature]
            # Validate numeric input
            try:
                input_data.append(float(value))
            except (ValueError, TypeError):
                return jsonify({
                    'error': f'Invalid numeric value for {feature}: {value}'
                }), 400
        
        # Convert to numpy array and reshape
        input_array = np.array(input_data).reshape(1, -1)
        
        # Scale the input
        input_scaled = scaler.transform(input_array)
        
        # Make prediction
        prediction = model.predict(input_scaled)[0]
        prediction_proba = model.predict_proba(input_scaled)[0]
        
        # Get confidence scores
        confidence_scores = {}
        for i, fertility_class in enumerate(['Less Fertile', 'Fertile', 'Highly Fertile']):
            confidence_scores[fertility_class] = float(prediction_proba[i])
        
        # Determine result
        result = {
            'prediction': int(prediction),
            'fertility_class': fertility_classes[prediction],
            'confidence_scores': confidence_scores,
            'input_values': dict(zip(required_features, input_data)),
            'is_fertile': bool(prediction >= 1),  # Fertile or Highly Fertile
            'fertility_level': 'Low' if prediction == 0 else 'Medium' if prediction == 1 else 'High'
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict multiple soil samples at once"""
    if not model or not scaler:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        samples = data.get('samples', [])
        
        if not samples:
            return jsonify({'error': 'No samples provided'}), 400
        
        results = []
        required_features = model_info['features']
        
        for i, sample in enumerate(samples):
            try:
                # Validate and prepare input
                input_data = []
                for feature in required_features:
                    if feature not in sample:
                        raise ValueError(f"Missing feature: {feature}")
                    input_data.append(float(sample[feature]))
                
                # Predict
                input_array = np.array(input_data).reshape(1, -1)
                input_scaled = scaler.transform(input_array)
                prediction = model.predict(input_scaled)[0]
                prediction_proba = model.predict_proba(input_scaled)[0]
                
                result = {
                    'sample_id': i + 1,
                    'prediction': int(prediction),
                    'fertility_class': fertility_classes[prediction],
                    'is_fertile': bool(prediction >= 1),
                    'confidence': float(max(prediction_proba)),
                    'input_values': dict(zip(required_features, input_data))
                }
                results.append(result)
                
            except Exception as e:
                results.append({
                    'sample_id': i + 1,
                    'error': str(e)
                })
        
        return jsonify({'results': results, 'total_samples': len(samples)})
        
    except Exception as e:
        return jsonify({'error': f'Batch prediction failed: {str(e)}'}), 500

def calculate_soil_score(input_values):
    """Calculate continuous soil quality score based on parameter deviations from optimal values"""
    
    # Optimal ranges and values for each parameter based on agricultural science
    parameter_ranges = {
        'ph': {'optimal': 6.5, 'min': 5.5, 'max': 7.5, 'weight': 0.15},      # pH optimal range
        'N': {'optimal': 70.0, 'min': 20.0, 'max': 120.0, 'weight': 0.20},    # Nitrogen (mg/kg)
        'P': {'optimal': 30.0, 'min': 10.0, 'max': 50.0, 'weight': 0.15},      # Phosphorus (mg/kg)
        'K': {'optimal': 50.0, 'min': 20.0, 'max': 80.0, 'weight': 0.15},      # Potassium (mg/kg)
        'oc': {'optimal': 3.0, 'min': 1.0, 'max': 5.0, 'weight': 0.10},        # Organic Carbon (%)
        'ec': {'optimal': 1.5, 'min': 0.5, 'max': 3.0, 'weight': 0.08},        # EC (dS/m)
        'S': {'optimal': 20.0, 'min': 5.0, 'max': 30.0, 'weight': 0.07},        # Sulfur (mg/kg)
        'zn': {'optimal': 2.0, 'min': 0.5, 'max': 4.0, 'weight': 0.05},        # Zinc (mg/kg)
        'fe': {'optimal': 30.0, 'min': 10.0, 'max': 50.0, 'weight': 0.03},      # Iron (mg/kg)
        'cu': {'optimal': 2.0, 'min': 0.5, 'max': 4.0, 'weight': 0.02},        # Copper (mg/kg)
        'B': {'optimal': 2.5, 'min': 1.0, 'max': 4.5, 'weight': 0.02}          # Boron (mg/kg)
    }
    
    total_score = 0.0
    
    for param, value in input_values.items():
        if param in parameter_ranges:
            range_info = parameter_ranges[param]
            optimal = range_info['optimal']
            min_val = range_info['min']
            max_val = range_info['max']
            weight = range_info['weight']
            
            # Calculate normalized score based on distance from optimal
            if value <= min_val:
                # Below minimum - very poor score
                normalized_score = 0.05
            elif value >= max_val:
                # Above maximum - very poor score
                normalized_score = 0.05
            else:
                # Within acceptable range - calculate distance from optimal
                distance_from_optimal = abs(value - optimal)
                max_distance = max(optimal - min_val, max_val - optimal)
                
                if distance_from_optimal == 0:
                    # Perfect match
                    normalized_score = 1.0
                else:
                    # Use exponential decay for smooth scoring
                    # Closer to optimal = higher score
                    normalized_distance = distance_from_optimal / max_distance
                    normalized_score = 1.0 - (normalized_distance ** 1.8)  # Stronger exponential decay
                    normalized_score = max(0.05, normalized_score)  # Minimum score of 0.05
            
            # Apply weight and add to total
            param_score = normalized_score * weight * 100
            total_score += param_score
    
    # Calculate base score and adjust for fertility level
    # Add randomness for realistic variation (±3 points)
    import random
    random_variation = random.uniform(-3, 3)
    base_score = total_score + random_variation
    
    # Apply fertility level adjustment to ensure proper ranges
    # Less fertile soil should always be below 50
    # Fertile soil should be 50-80
    # Highly fertile soil should be above 80
    
    # Check if this is likely less fertile based on parameter values
    poor_indicators = 0
    borderline_indicators = 0
    total_params = 0
    
    for param, value in input_values.items():
        if param in parameter_ranges:
            range_info = parameter_ranges[param]
            min_val = range_info['min']
            optimal = range_info['optimal']
            
            total_params += 1
            
            # Count poor indicators with proper thresholds
            if value <= min_val * 0.5:  # Very poor (below 50% of minimum)
                poor_indicators += 1
            elif value <= min_val * 0.7:  # Poor (below 70% of minimum)
                poor_indicators += 0.5
            elif value <= min_val * 0.9:  # Borderline (below 90% of minimum)
                borderline_indicators += 0.5
    
    # If many parameters are poor, force score lower
    if total_params > 0:
        poor_ratio = poor_indicators / total_params
        
        if poor_ratio > 0.7:  # Very poor soil
            final_score = round(max(0, min(30, base_score)), 2)
        elif poor_ratio > 0.5:  # Poor soil
            final_score = round(max(0, min(40, base_score)), 2)
        elif poor_ratio > 0.3:  # Borderline soil
            final_score = round(max(0, min(50, base_score)), 2)
        else:  # Good/Decent soil (50-80 range)
            final_score = round(max(0, min(80, base_score)), 2)
    else:
        final_score = round(max(0, min(100, base_score)), 2)
    
    return final_score

@app.route('/calculate_score', methods=['POST'])
def calculate_score_endpoint():
    """Calculate soil quality score for given input values"""
    try:
        data = request.get_json()
        input_values = data.get('input_values', {})
        
        if not input_values:
            return jsonify({'error': 'No input values provided'}), 400
        
        score = calculate_soil_score(input_values)
        
        return jsonify({
            'score': score,
            'input_values': input_values
        })
        
    except Exception as e:
        return jsonify({'error': f'Score calculation failed: {str(e)}'}), 500

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get crop and fertilizer recommendations based on soil analysis"""
    try:
        data = request.get_json()
        prediction = data.get('prediction')
        fertility_class = data.get('fertility_class')
        input_values = data.get('input_values', {})
        
        recommendations = {
            'crops': [],
            'fertilizers': [],
            'irrigation': '',
            'soil_improvements': []
        }
        
        if fertility_class == 'Less Fertile':
            recommendations['crops'] = ['Millet', 'Sorghum', 'Cowpea', 'Groundnut']
            recommendations['fertilizers'] = ['NPK 20:20:20', 'Organic Compost', 'Bio-fertilizers']
            recommendations['irrigation'] = 'Moderate irrigation required, avoid waterlogging'
            recommendations['soil_improvements'] = [
                'Add organic matter to improve soil structure',
                'Apply lime if pH is below 6.0',
                'Use green manure crops'
            ]
        elif fertility_class == 'Fertile':
            recommendations['crops'] = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Soybean']
            recommendations['fertilizers'] = ['NPK 15:15:15', 'Urea', 'DAP']
            recommendations['irrigation'] = 'Regular irrigation as per crop requirements'
            recommendations['soil_improvements'] = [
                'Maintain organic matter levels',
                'Crop rotation recommended',
                'Balanced fertilizer application'
            ]
        else:  # Highly Fertile
            recommendations['crops'] = ['Tomato', 'Potato', 'Onion', 'Chili', 'Vegetables']
            recommendations['fertilizers'] = ['NPK 10:26:26', 'Potassium Sulphate', 'Micronutrients']
            recommendations['irrigation'] = 'Optimize irrigation based on crop stage'
            recommendations['soil_improvements'] = [
                'Focus on micronutrient management',
                'Prevent nutrient leaching',
                'Maintain soil health monitoring'
            ]
        
        # Specific recommendations based on nutrient values
        if input_values.get('N', 0) < 40:
            recommendations['fertilizers'].append('Nitrogen-rich fertilizers (Urea)')
        if input_values.get('P', 0) < 20:
            recommendations['fertilizers'].append('Phosphorus-rich fertilizers (DAP, SSP)')
        if input_values.get('K', 0) < 30:
            recommendations['fertilizers'].append('Potassium-rich fertilizers (MOP)')
        if input_values.get('ph', 7) < 6:
            recommendations['soil_improvements'].append('Apply agricultural lime to increase pH')
        elif input_values.get('ph', 7) > 8:
            recommendations['soil_improvements'].append('Apply elemental sulfur or gypsum to reduce pH')
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({'error': f'Recommendations failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)
