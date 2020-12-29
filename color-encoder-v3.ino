
#include <Arduino.h>
#include <SPI.h>
#include "Adafruit_BLE.h"
#include "Adafruit_BluefruitLE_SPI.h"
#include "Adafruit_BluefruitLE_UART.h"

#include "BluefruitConfig.h"

    #define MINIMUM_FIRMWARE_VERSION    "0.6.6"
    #define MODE_LED_BEHAVIOUR          "MODE"

Adafruit_BluefruitLE_SPI ble(BLUEFRUIT_SPI_CS, BLUEFRUIT_SPI_IRQ, BLUEFRUIT_SPI_RST);

int w = 6;
int r = 5;
int g = 10;
int b = 9;
int enablePin = 22;
int warning = 26;
int brightness = 0x20;

int wp = 0;
int rp = 255;
int gp = 0;
int bp = 255;

float rb = 255;
float gb = 128;
float bb = 128;
float wb = 128;

void setup()
{
   pinMode(w, OUTPUT);
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);
  pinMode(enablePin, OUTPUT);
  pinMode(warning, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  delay(500);
  digitalWrite(warning, HIGH);
  disable();
  delay(2000);
  enable();
  writeColor(255, 0, 0, 0);
  delay(500);
  writeColor(0, 255, 0, 0);
  delay(500);
  writeColor(0, 0, 255, 0);
  delay(500);
  writeColor(0, 0, 0, 255);
  delay(500);
  
  Serial.begin(115200);
  
  if (!ble.begin(true)) {
    Serial.println("bluetooth is busted");
  }
  ble.echo(false);

  ble.info();

  ble.verbose(false);

  /* Wait for connection */
  while (! ble.isConnected()) {
    float v = ((float) millis()) / 200000;
    hslToRgb(v - floor(v));
  }
  
  ble.setMode(BLUEFRUIT_MODE_DATA);
//  delay(500);
//  writeColor(255, 0, 255, 0);
}

int v[37];
int vi = 0;

void loop()
{
  if (ble.available() > 0) {
    Serial.println("rip");
    
     int bitshift = 0;
     bool first = true;
     int c = 0;
     int index = 0;

     while (ble.available() > 0) {
       if (first) {
         first = false;
         c = ble.read();
       } else {
        v[index] = ble.read();
        Serial.println(v[index]);
        
        index++;
       }
     }

     if (c == 0) {

       if (v[0] == 0) {
         digitalWrite(warning, HIGH);
       } else if (v[0] == 1) {
         digitalWrite(warning, LOW);
       } else if (v[0] == 2) {
         enable();
       } else if (v[0] == 3) {
         disable();
       }
     } else if (c == 1) {
       brightness = v[0];
       writeColor(rp, gp, bp, wp);
     } else if (c == 2) {      
       rb = v[0];
       gb = v[1];
       bb = v[2];
       wb = v[3];
       
       writeColor(rp, gp, bp, wp);
     } else {
       vi = 0;
     }
  }
  
  if (vi == 16) {
    vi += 4;
  } else if (vi < 16) {
    rp = v[vi+0];
    gp = v[vi+1];
    bp = v[vi+2];
    wp = v[vi+3];

    Serial.print(rp);
    Serial.print(gp);
    Serial.print(bp);
    Serial.println(wp);
    
    writeColor(rp, gp, bp, wp);

    vi += 4;
  }
  delay(200);
}

float hue2rgb(float t) {
  if(t < 0) t += 1;
  if(t > 1) t -= 1;
  if(t < (1.0/6.0)) return 6 * t;
  if(t < (1.0/2.0)) return 1;
  if(t < (2.0/3.0)) return (2.0/3.0 - t) * 6;
  return 0;
}

void hslToRgb(float h){
    float r = hue2rgb(h + (1.0/3.0));
    float g = hue2rgb(h);
    float b = hue2rgb(h - (1.0/3.0));

    writeColor(r * 255.0, g * 255.0, b * 255.0, 0);
}

void enable() {
  pinMode(w, OUTPUT);
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);
  writeColor(rp, gp, bp, wp);

  digitalWrite(enablePin, HIGH);
  digitalWrite(warning, HIGH);
}

void disable() {
  pinMode(w, INPUT);
  pinMode(r, INPUT);
  pinMode(g, INPUT);
  pinMode(b, INPUT);

  digitalWrite(enablePin, LOW);
}

void writeColor(float ri, float gi, float bi, float wi)
{
  analogWrite(r, sq(ri/255.0)*(brightness/255.0*(rb/255))*255);
  analogWrite(g, sq(gi/255.0)*(brightness/255.0*(gb/255))*255);
  analogWrite(b, sq(bi/255.0)*(brightness/255.0*(bb/255))*255);
  analogWrite(w, sq(wi/255.0)*(brightness/255.0*(wb/255))*255);
}
