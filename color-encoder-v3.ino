int w = 7;
int r = 8;
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
  Serial.begin(9600); 
  
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
  Serial.print("start\n");
//  delay(2000);
  enable();
//  writeColor(255, 0, 0, 0);
//  delay(500);
//  writeColor(0, 255, 0, 0);
//  delay(500);
//  writeColor(0, 0, 255, 0);
//  delay(500);
//  writeColor(0, 0, 0, 255);
//  delay(500);
//  writeColor(255, 0, 255, 0);

  Serial.print("ready\n");
}

void loop()
{
  // if (step < (sizeof(seq) / sizeof(int))/5.0) {
  //   writeColor(seq[0+(step*5)], seq[1+(step*5)], seq[2+(step*5)], seq[3+(step*5)]);
  //   delay((int)seq[4+(step*5)]);
  //   step = step + 1;
  // } else {
  //   writeColor(0, 0, 0, 255);
  // }

  if (Serial.available() > 0) {
     int v[4];

     int bitshift = 0;
     bool first = true;
     int c = 0;
     int index = 0;

     while (Serial.available() > 0) {
       if (first) {
         first = false;
         c = Serial.read();
       } else {
        v[index] = Serial.read();
        
        index++;
       }

       delay(2);
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
       rp = v[0];
       gp = v[1];
       bp = v[2];
       wp = v[3];

       writeColor(rp, gp, bp, wp);
     }

     Serial.print("r\n");
  }
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

void writeColor(int ri, int gi, int bi, int wi)
{
  analogWrite(r, sq(ri/255.0)*(brightness/255.0*(rb/255))*255);
  analogWrite(g, sq(gi/255.0)*(brightness/255.0*(gb/255))*255);
  analogWrite(b, sq(bi/255.0)*(brightness/255.0*(bb/255))*255);
  analogWrite(w, sq(wi/255.0)*(brightness/255.0*(wb/255))*255);
}
