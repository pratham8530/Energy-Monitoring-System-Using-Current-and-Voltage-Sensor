from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Dictionary to store sensor data
sensor_data = {
    'current': 0,
    'voltage': 0,
    'power': 0,
    'energy': 0
}

# Dictionary to store limits for each parameter
limits = {
    'current': None,
    'voltage': None,
    'power': None,
    'energy': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data', methods=['POST'])
def data():
    global sensor_data
    # Get JSON data from the request
    data = request.get_json()
    
    # Update sensor data
    if data:
        sensor_data['current'] = data.get('current', 0)
        sensor_data['voltage'] = data.get('voltage', 0)
        sensor_data['power'] = data.get('power', 0)
        sensor_data['energy'] = data.get('energy', 0)

    return jsonify({"message": "Data received successfully!"})

@app.route('/data', methods=['GET'])
def get_data():
    return jsonify(sensor_data)

# Route to set limits for parameters
@app.route('/set-limits', methods=['POST'])
def set_limits():
    data = request.get_json()
    limits['current'] = data.get('current_limit')
    limits['voltage'] = data.get('voltage_limit')
    limits['power'] = data.get('power_limit')
    limits['energy'] = data.get('energy_limit')
    return jsonify({"message": "Limits set successfully!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
