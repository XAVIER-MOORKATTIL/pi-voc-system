#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <math.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>

// Simulated or real Linux sysfs GPIO base path
#define GPIO_EXPORT_PATH "/sys/class/gpio/export"
#define GPIO_PIN "18"
#define GPIO_DIR_PATH "/sys/class/gpio/gpio18/direction"
#define GPIO_VAL_PATH "/sys/class/gpio/gpio18/value"

// Cgroup v2 configuration path
#define CGROUP_PATH "/sys/fs/cgroup/pivoc"

// First 20 digits of Pi for frequency modulation sequence
const int pi_digits[] = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4};
const int total_digits = 20;

void write_file(const char* path, const char* value) {
    int fd = open(path, O_WRONLY);
    if (fd < 0) {
        // Fallback print for standard operating systems without Linux sysfs
        printf("[Bare-Metal Sysfs Simulation] %s -> %s\n", path, value);
        return;
    }
    write(fd, value, strlen(value));
    close(fd);
}

void configure_cgroups(int cpu_quota_percent) {
    char quota_str[64];
    snprintf(quota_str, sizeof(quota_str), "%d 100000", cpu_quota_percent * 1000);
    printf("[Linux Kernel Cgroups] Mutating /sys/fs/cgroup/pivoc/cpu.max -> %s\n", quota_str);
    write_file("/sys/fs/cgroup/pivoc/cpu.max", quota_str);
}

void setup_gpio() {
    write_file(GPIO_EXPORT_PATH, GPIO_PIN);
    usleep(100000); // 100ms delay for device tree export
    write_file(GPIO_DIR_PATH, "out");
}

int main() {
    printf("===============================================================\n");
    printf("   PROJECT Pi-VOC: BARE-METAL RISC-V KINETIC EXECUTION ENGINE   \n");
    printf("===============================================================\n");

    setup_gpio();
    configure_cgroups(20); // Initial 20% Cgroup CPU allocation

    int pi_index = 0;
    int socket_connected = 1; // Simulated connection state
    int loop_counter = 0;

    while(1) {
        loop_counter++;
        
        // 1. Calculate Pi-Derived Kinetic Frequency Modulation
        int digit = pi_digits[pi_index % total_digits];
        double frequency_hz = 300.0 + (digit * 12.3456);
        pi_index++;

        // 2. Pulse Physical Hardware GPIO
        write_file(GPIO_VAL_PATH, "1");
        usleep(100000); // 100ms pulse high
        write_file(GPIO_VAL_PATH, "0");

        // 3. Autonomous Mutation Test Check (Simulate network disconnect at step 15)
        if (loop_counter == 15) {
            printf("\n[ALERT] WebSocket Connection Severed! Entering Autonomous Hardware Mutation Mode...\n");
            socket_connected = 0;
        }

        if (!socket_connected) {
            // Autonomous adaptation without cloud intervention
            printf("[Autonomous Engine] Local network lost. Adjusting Cgroup quota to emergency bounds...\n");
            configure_cgroups(50); // Scale up local computing resource
            frequency_hz = 400.0 + (digit * 5.0); // Shift clock pattern
        }

        printf("[Node Telemetry] Freq: %.4f Hz | Pin: %s | Cgroup: %s\n", 
               frequency_hz, 
               (loop_counter % 2 == 0) ? "HIGH" : "LOW",
               socket_connected ? "NORMAL" : "AUTONOMOUS_MUTATED");

        sleep(1);
    }

    return 0;
}