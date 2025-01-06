#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Your WIFI Name";
const char* password = "Wifi Password";
const char* serverURL = "your flask IP address HERE"; // Replace with your Flask server IP

int sensorPin = 33;
int numSamples = 1000; // Reduced for faster sampling
float sensitivity = 1.195713;
float vRef = 3.3;
float offsetVoltage = 1.65;

float measureCurrent() {
  long sensorValueSum = 0;
  for (int i = 0; i < numSamples; i++) {
    sensorValueSum += analogRead(sensorPin);
  }
  float sensorValueAvg = sensorValueSum / numSamples;
  long sqSum = 0;
  for (int i = 0; i < numSamples; i++) {
    int sensorValue = analogRead(sensorPin);
    float diff = sensorValue - sensorValueAvg;
    sqSum += diff * diff;
  }
  float rms = sqrt(sqSum / numSamples);
  float voltageRMS = (rms / 4095.0) * vRef;
  return voltageRMS / sensitivity;
}

const int voltagePin = 32;
float calibrationFactor = 642.6238;
float Vpp = 0.0;
float Vrms = 0.0;
float voltage = 0.0;
const float noiseThreshold = 25.0;
const float hysteresis = 1.0;
float power = 0.0;
unsigned long startTime = 0;
float energyUsed = 0.0;
bool stableReadings = false;

// Buffer to store averaged current
const int numAveragingSamples = 10;  // Number of readings to average
float currentBuffer[numAveragingSamples];  // Buffer to store readings
int currentIndex = 0;  // Index to track buffer position

float averageCurrent() {
  float sum = 0;
  for (int i = 0; i < numAveragingSamples; i++) {
    sum += currentBuffer[i];
  }
  return sum / numAveragingSamples;
}

float calculateVoltage() {
  Vpp = getVPP();
  Vrms = (Vpp / 2.0) * 0.707;
  voltage = Vrms * calibrationFactor;
  return voltage < noiseThreshold ? 0.0 : voltage;
}

float calculatePower(float current) {
  return current * voltage;
}

float calculateEnergy(float power) {
  unsigned long elapsedTime = millis() - startTime;
  float timeInHours = elapsedTime / 3600000.0;
  return (power * timeInHours) / 1000.0;
}

float getVPP() {
  int maxValue = 0;
  int minValue = 4095;
  for (int i = 0; i < 1000; i++) {  // Reduced samples for faster voltage reading
    int readValue = analogRead(voltagePin);
    if (readValue > maxValue) maxValue = readValue;
    if (readValue < minValue) minValue = readValue;
  }
  return (maxValue - minValue) * (3.3 / 4095.0);
}

void setup() {
  // Comment this out to remove dependency on Serial Monitor
  Serial.begin(115200);

  // Initialize WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); // Reduced delay for faster connection attempts
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi!");

  // Initialize current buffer to 0
  for (int i = 0; i < numAveragingSamples; i++) {
    currentBuffer[i] = 0;
  }
}

void loop() {
  float current = measureCurrent();
  float zeroCurrentOffset = 0.2109;
  current = (current - zeroCurrentOffset);
  if (current < 0) current = 0;

  // Add the current reading to the buffer
  currentBuffer[currentIndex] = current;
  currentIndex = (currentIndex + 1) % numAveragingSamples;  // Update index cyclically

  // Get the averaged current value
  float averagedCurrent = averageCurrent();

  voltage = calculateVoltage();
  power = calculatePower(averagedCurrent);

  if (averagedCurrent > 0.1 && voltage > noiseThreshold) {
    if (!stableReadings) {
      stableReadings = true;
      startTime = millis();
    }
  } else {
    stableReadings = false;
  }

  if (stableReadings) {
    energyUsed = calculateEnergy(power);
  }

  // Send data to Flask server
  sendToServer(averagedCurrent, voltage, power, energyUsed);

  // Optional Serial output for debugging
  Serial.print("Averaged Current (A): ");
  Serial.println(averagedCurrent, 4);
  Serial.print("AC Voltage: ");
  Serial.println(voltage, 2);
  Serial.print("Power (W): ");
  Serial.println(power, 2);
  Serial.print("Energy Used (kWh): ");
  Serial.println(energyUsed, 6);

  delay(1000); // Reduced delay for more frequent (live-like) updates
}

void sendToServer(float current, float voltage, float power, float energy) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL); // Specify server URL
    http.addHeader("Content-Type", "application/json");

    // Create JSON data
    String jsonPayload = "{";
    jsonPayload += "\"current\": " + String(current, 2) + ",";
    jsonPayload += "\"voltage\": " + String(voltage) + ",";
    jsonPayload += "\"power\": " + String(power, 1) + ",";
    jsonPayload += "\"energy\": " + String(energy, 6);
    jsonPayload += "}";

    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.println("Error in sending POST request");
    }

    http.end(); // Close connection
  } else {
    Serial.println("WiFi not connected!");
  }
}
