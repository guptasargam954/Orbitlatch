#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>

#ifdef _WIN32
    #include <windows.h>
    #define CLEAR() system("cls")
    #define SLEEP(x) Sleep((x)*1000)
#else
    #include <unistd.h>
    #define CLEAR() system("clear")
    #define SLEEP(x) sleep(x)
#endif

// Add M_PI if not defined
#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define MAX_SATS 20
#define MAX_USERS 200
#define MAX_ALERTS 1000
#define SIM_DURATION 180
#define FAILURE_PROB 5
#define RSSI_HISTORY 5
#define EARTH_RADIUS 6371.0  // in km
#define ORBIT_HEIGHT_MIN 400.0
#define ORBIT_HEIGHT_MAX 2000.0

/* ================= STRUCTURES ================= */
typedef struct {
    int id;
    float x;          // Position angle (0-360)
    float dist;       // Distance from Earth station (km)
    float rssi;       // Signal strength
    float snr;
    float temp;
    float reliability;
    float score;
    int users;
    int max_users;
    int uptime;
    int fails;
    int health;
    float rssi_hist[RSSI_HISTORY];
} Satellite;

typedef struct {
    char level[12];
    char msg[140];
    int timestamp;
} Alert;

/* ================= GLOBALS ================= */
Satellite sats[MAX_SATS];
Alert alerts[MAX_ALERTS];
int alert_count = 0;
int system_time = 0;
int active_sat = -1;
float space_weather = 1.0;

/* ============== ALERT SYSTEM ============== */
void raise_alert(const char *level, const char *msg) {
    if (alert_count >= MAX_ALERTS) return;

    strcpy(alerts[alert_count].level, level);
    strcpy(alerts[alert_count].msg, msg);
    alerts[alert_count].timestamp = system_time;
    alert_count++;

    FILE *log = fopen("orbit_latch.log", "a");
    if (log) {
        fprintf(log, "[%04ds] %-10s %s\n", system_time, level, msg);
        fclose(log);
    }
}

/* ================= CALCULATIONS ================= */
float calc_distance(float angle) {
    // Convert orbital angle to distance from ground station (simplified)
    float orbit_radius = EARTH_RADIUS + ORBIT_HEIGHT_MIN + (rand() % (int)(ORBIT_HEIGHT_MAX - ORBIT_HEIGHT_MIN));
    return orbit_radius * fabs(cos(angle)); // km
}

float calc_rssi(float dist) {
    float r = 1200.0f / dist; // Simple path-loss model
    r *= space_weather;
    return (r > 100) ? 100 : r;
}

float predict_rssi(int i) {
    return (sats[i].rssi_hist[0] + sats[i].rssi_hist[RSSI_HISTORY-1]) / 2.0f;
}

/* ================= INITIALIZATION ================= */
void init_sats() {
    for (int i = 0; i < MAX_SATS; i++) {
        sats[i].id = 700 + i;
        sats[i].x = ((float)rand() / RAND_MAX) * 2 * M_PI; // random angle
        sats[i].users = 0;
        sats[i].max_users = MAX_USERS;
        sats[i].uptime = 0;
        sats[i].fails = 0;
        sats[i].health = 1;
        sats[i].temp = 25.0f + (rand() % 10); // realistic start temp
        sats[i].reliability = 1.0f;

        sats[i].dist = calc_distance(sats[i].x);
        sats[i].rssi = calc_rssi(sats[i].dist);

        for (int j = 0; j < RSSI_HISTORY; j++)
            sats[i].rssi_hist[j] = sats[i].rssi;

        sats[i].score = sats[i].rssi;
    }
}

/* ================= UPDATE SATELLITES ================= */
void update_sats() {
    // Random space weather change
    space_weather = (rand() % 100 < 20) ? 0.8f : 1.0f;

    for (int i = 0; i < MAX_SATS; i++) {
        if (!sats[i].health) continue;

        sats[i].x += 0.05f; // orbit movement
        if (sats[i].x > 2*M_PI) sats[i].x -= 2*M_PI;

        sats[i].dist = calc_distance(sats[i].x);
        sats[i].rssi = calc_rssi(sats[i].dist);
        sats[i].snr = sats[i].rssi / 3.0f;

        memmove(&sats[i].rssi_hist[0], &sats[i].rssi_hist[1], sizeof(float) * (RSSI_HISTORY -1));
        sats[i].rssi_hist[RSSI_HISTORY-1] = sats[i].rssi;

        sats[i].temp += sats[i].rssi * 0.005f; // heat from signal

        if (sats[i].temp > 80) {
            sats[i].health = 0;
            sats[i].users = 0;
            raise_alert("CRITICAL", "Thermal overload detected");
        }

        if (rand() % 100 < FAILURE_PROB) {
            sats[i].health = 0;
            sats[i].users = 0;
            sats[i].fails++;
            sats[i].reliability -= 0.1f;
            if (sats[i].reliability < 0.1f) sats[i].reliability = 0.1f;

            raise_alert("CRITICAL", "Satellite failure occurred");

            if (active_sat == i) {
                active_sat = -1;
                raise_alert("EMERGENCY", "Active satellite lost");
            }
        }
    }
}

/* ================= SATELLITE SELECTION ================= */
int find_best_sat() {
    int best = -1;
    float best_score = -1;

    for (int i = 0; i < MAX_SATS; i++) {
        if (!sats[i].health || sats[i].users >= sats[i].max_users) continue;

        float load = (float)sats[i].users / sats[i].max_users;
        float predicted = predict_rssi(i);
        sats[i].score = predicted * sats[i].reliability / (1 + load);

        if (sats[i].score > best_score) {
            best_score = sats[i].score;
            best = i;
        }
    }
    return best;
}

/* ================= CONNECTION MANAGER ================= */
void manage_connection() {
    if (active_sat != -1) {
        if (!sats[active_sat].health || predict_rssi(active_sat) < 35) {
            if (sats[active_sat].users > 0) sats[active_sat].users--;
            raise_alert("INFO", "Predictive handover triggered");
            active_sat = -1;
        } else sats[active_sat].uptime++;
    }

    if (active_sat == -1) {
        int next = find_best_sat();
        if (next != -1) {
            active_sat = next;
            sats[next].users++;
            sats[next].uptime = 0;
            raise_alert("INFO", "User connected to satellite");
        } else {
            raise_alert("WARNING", "No satellite available");
        }
    }
}

/* ================= JSON OUTPUT FOR WEB ================= */
void output_json() {
    printf("{");
    printf("\"time\":%d,", system_time);
    printf("\"weather\":%.2f,", space_weather);
    printf("\"active_sat\":%d,", active_sat != -1 ? sats[active_sat].id : -1);
    
    printf("\"sats\":[");
    for (int i = 0; i < MAX_SATS; i++) {
        printf("{");
        printf("\"id\":%d,", sats[i].id);
        printf("\"health\":%d,", sats[i].health);
        printf("\"dist\":%.2f,", sats[i].dist);
        printf("\"rssi\":%.2f,", sats[i].rssi);
        printf("\"load\":%d,", (sats[i].users * 100) / MAX_USERS);
        printf("\"snr\":%.2f,", sats[i].snr);
        printf("\"temp\":%.2f,", sats[i].temp);
        printf("\"rel\":%.2f,", sats[i].reliability);
        printf("\"up\":%d,", sats[i].uptime);
        printf("\"fail\":%d,", sats[i].fails);
        printf("\"score\":%.2f", sats[i].score);
        printf("}%s", (i < MAX_SATS - 1) ? "," : "");
    }
    printf("],");

    printf("\"alerts\":[");
    for (int i = 0; i < alert_count; i++) {
        printf("{");
        printf("\"time\":%d,", alerts[i].timestamp);
        printf("\"level\":\"%s\",", alerts[i].level);
        printf("\"msg\":\"%s\"", alerts[i].msg);
        printf("}%s", (i < alert_count - 1) ? "," : "");
    }
    printf("]");
    printf("}\n");
    fflush(stdout);
}

/* ================= MAIN ================= */
int main(int argc, char **argv) {
    srand(time(NULL));
    init_sats();

    // If "json" argument is passed, output JSON instead of table
    int use_json = (argc > 1 && strcmp(argv[1], "json") == 0);

    if (!use_json) {
        printf("Starting ORBIT-LATCH v4.0 Simulation...\n");
        SLEEP(1);
    }

    while (system_time < SIM_DURATION) {
        system_time++;
        update_sats();
        manage_connection();
        
        if (use_json) {
            output_json();
        } else {
            // Original render code if needed for standalone use
            // but we'll prioritize the JSON for web integration
        }
        
        SLEEP(1);
    }

    return 0;
}
