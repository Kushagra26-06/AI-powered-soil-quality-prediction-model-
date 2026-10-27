import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_soil_quality_model():
    # Load the dataset
    dataset_path = r'c:\Users\Kushagra\OneDrive\Documents\Artificial Intelligence\Soil_Quality_Prediction_Dataset_1000.xlsx'
    df = pd.read_excel(dataset_path)
    
    # Map soil quality to fertility classes as requested by user
    # Poor -> Less Fertile (0), Average -> Fertile (1), Good -> Highly Fertile (2)
    quality_mapping = {
        'Poor': 0,
        'Average': 1,
        'Good': 2
    }
    
    df['fertility'] = df['SoilQuality'].map(quality_mapping)
    
    # Define features using only the 11 parameters that frontend sends
    features = [
        'pH', 'Nitrogen', 'Phosphorus', 'Potassium', 'EC', 'OrganicMatter',
        'Sulfur', 'Zinc', 'Iron', 'Copper', 'CarbonContent'
    ]
    
    # Rename columns to match user's preferred naming
    feature_mapping = {
        'pH': 'ph',
        'Nitrogen': 'N',
        'Phosphorus': 'P', 
        'Potassium': 'K',
        'EC': 'ec',
        'OrganicMatter': 'oc',
        'Sulfur': 'S',
        'Iron': 'fe',
        'Zinc': 'zn',
        'Copper': 'cu',
        'CarbonContent': 'B'  # Using CarbonContent as proxy for Boron
    }
    
    # Prepare features and target
    X = df[features].copy()
    y = df['fertility']
    
    # Rename columns to match user's naming convention
    X.columns = [feature_mapping[col] for col in features]
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = model.predict(X_test_scaled)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Less Fertile', 'Fertile', 'Highly Fertile']))
    
    # Save the model and scaler
    joblib.dump(model, 'soil_quality_model.pkl')
    joblib.dump(scaler, 'soil_quality_scaler.pkl')
    
    # Save feature names and mapping
    model_info = {
        'features': list(X.columns),
        'feature_mapping': feature_mapping,
        'fertility_classes': {
            0: 'Less Fertile',
            1: 'Fertile', 
            2: 'Highly Fertile'
        }
    }
    joblib.dump(model_info, 'model_info.pkl')
    
    print("\nModel and scaler saved successfully!")
    print(f"Features used: {list(X.columns)}")
    
    return model, scaler, model_info

if __name__ == "__main__":
    train_soil_quality_model()
