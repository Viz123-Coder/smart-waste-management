/*
  Smart Waste Bin - ESP32 Firmware
  ==================================
  What this does:
  1. Reads distance from an ultrasonic sensor (HC-SR04) mounted at the top
     of the bin, facing down at the waste.
  2. Converts that distance into a fill percentage (empty bin = long
     distance, full bin = short distance).
  3. Optionally reads weight (HX711 + load cell) and temperature (DHT22/DS18B20).
  4. Sends all of this as a JSON HTTP POST to the Flask backend's
     /api/sensor-data endpoint, exactly like the test script does.

  WIRING (HC-SR04 ultrasonic sensor):
    VCC  -> 5V
    GND  -> GND
    TRIG -> GPIO 5
    ECHO -> GPIO 18   (use a voltage divider - ECHO outputs 5V, ESP32 GPIO is 3.3V!)

  Before uploading:
  - Install "ArduinoJson" library via Library Manager
  - Set WIFI_SSID, WIFI_PASSWORD, and SERVER_URL below
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------- CONFIGURE THESE ----------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "http://YOUR_BACKEND_IP:5000/api/sensor-data";
const char* BIN_ID = "BIN001";
const char* BIN_LOCATION = "Zone A - Market Street";
const float BIN_LATITUDE = 13.0827;
const float BIN_LONGITUDE = 80.2707;

// ---------- SENSOR PINS ----------
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// ---------- BIN PHYSICAL DIMENSIONS ----------
// Distance (cm) from the sensor to the BOTTOM of an empty bin.
// Measure this once when you install the sensor.
const float BIN_EMPTY_DISTANCE_CM = 60.0;
// Distance (cm) considered "full" (waste almost touching the sensor)
const float BIN_FULL_DISTANCE_CM = 5.0;

const unsigned long SEND_INTERVAL_MS = 60000; // send a reading every 60 seconds

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  connectToWiFi();
}

void loop() {
  float distanceCm = readUltrasonicDistance();
  float fillPercentage = distanceToFillPercentage(distanceCm);

  Serial.printf("Distance: %.1f cm | Fill: %.1f%%\n", distanceCm, fillPercentage);

  sendReading(fillPercentage);

  delay(SEND_INTERVAL_MS);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP address: " + WiFi.localIP().toString());
}

float readUltrasonicDistance() {
  // Send a 10-microsecond pulse to trigger the sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure how long the echo pulse lasts (microseconds)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout ~ 5m max range

  // Speed of sound = 0.0343 cm/microsecond. Divide by 2 for round trip.
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

float distanceToFillPercentage(float distanceCm) {
  // Closer distance = fuller bin, so we invert the ratio.
  float fill = (BIN_EMPTY_DISTANCE_CM - distanceCm) /
               (BIN_EMPTY_DISTANCE_CM - BIN_FULL_DISTANCE_CM) * 100.0;

  // Clamp to a sensible 0-100 range in case of sensor noise
  if (fill < 0) fill = 0;
  if (fill > 100) fill = 100;
  return fill;
}

void sendReading(float fillPercentage) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, skipping send.");
    connectToWiFi();
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["bin_id"] = BIN_ID;
  doc["fill_percentage"] = fillPercentage;
  doc["location"] = BIN_LOCATION;
  doc["latitude"] = BIN_LATITUDE;
  doc["longitude"] = BIN_LONGITUDE;
  // Add doc["weight"] and doc["temperature"] here once those sensors are wired up

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    Serial.printf("Server response [%d]: %s\n", httpResponseCode, http.getString().c_str());
  } else {
    Serial.printf("POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
