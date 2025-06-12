#include <MD_MAX72xx.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
ESP8266WebServer server(80);

// Wi-Fi Credentials
const char* ssid = "Galaxy A15";
const char* password = "satvik0110";

// Hardware connections for ESP8266
#define BUZZER_PIN 5  // D1
#define CLK_PIN   14 //D5
#define DATA_PIN  13 //D7
#define CS_PIN    15 //D8

#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 4
#define SCROLL_DELAY 75

MD_MAX72XX mx = MD_MAX72XX(HARDWARE_TYPE, CS_PIN, MAX_DEVICES);

// Global message logic
String currentMessage = "SCRC Lab  ";
String customMessage = "";
bool isCustomMessage = false;
int scrollCount = 0;

//Function to connect to WiFi
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(500);
    Serial.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to Wi-Fi.");
  }
}

//custom msg display logic on request
void handleDisplay() {
  if (server.hasArg("msg")) {
    customMessage = server.arg("msg") + "  ";
    currentMessage = customMessage;
    isCustomMessage = true;
    scrollCount = 0;
      // Buzz for 2 seconds
    digitalWrite(BUZZER_PIN, HIGH);
    delay(2000);
    digitalWrite(BUZZER_PIN, LOW);

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "Message set to: " + customMessage);
    Serial.println("Received new message: " + customMessage);
  } else {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(400, "text/plain", "Please provide ?msg=YOURTEXT");
  }
}

void scrollMessage(const char *message) {
  uint8_t charWidth;
  uint8_t cBuf[8];
  mx.clear();

  const char *ptr = message;

  while (*ptr != '\0') {
    charWidth = mx.getChar(*ptr++, sizeof(cBuf), cBuf);
    for (uint8_t col = 0; col < charWidth; col++) {
      mx.transform(MD_MAX72XX::TSL);
      mx.setColumn(0, cBuf[col]);
      delay(SCROLL_DELAY);
    }
    mx.transform(MD_MAX72XX::TSL);
    mx.setColumn(0, 0);
    delay(SCROLL_DELAY);
  }

  for (uint8_t col = 0; col < mx.getColumnCount(); col++) {
    mx.transform(MD_MAX72XX::TSL);
    delay(SCROLL_DELAY);
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);  // Ensure it's off at start
  mx.begin();
  mx.control(MD_MAX72XX::INTENSITY, 5);
  connectToWiFi();

  server.on("/display", handleDisplay);
  server.begin();
  Serial.println("Server started. Send /display?msg=Hello");
}

void loop() {
  server.handleClient();

  scrollMessage(currentMessage.c_str());
 //scrolls custom msg 5 times before returning to default msg(SCRC Lab)
  if (isCustomMessage) {
    scrollCount++;
    if (scrollCount >= 5) {
      currentMessage = "SCRC Lab  ";
      isCustomMessage = false;
      scrollCount = 0;
    }
  }

  mx.clear();
  delay(500);
}
