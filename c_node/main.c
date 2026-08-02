#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>

#define GPIO_PIN "18"
#define GPIO_PATH "/sys/class/gpio/gpio18/value"
#define CGROUP_PATH "/sys/fs/cgroup/cpu/pivoc_node/cpu.cfs_quota_us"

// Pi Digits sequence for non-repeating frequency modulation
const double PI_DIGITS[] = {3.1415, 9.2653, 5.8979, 3.2384, 6.2643, 3.8327, 9.5028, 8.4197};
const int PI_LEN = 8;

// Export and configure GPIO Pin via Linux Sysfs
void setup_gpio() {
    int fd = open("/sys/class/gpio/export", O_WRONLY);
    if (fd != -1) {
        write(fd, GPIO_PIN, strlen(GPIO_PIN));
        close(fd);
    }
    
    char direction_path[64];
    snprintf(direction_path, sizeof(direction_path), "/sys/class/gpio/gpio%s/direction", GPIO_PIN);
    fd = open(direction_path, O_WRONLY);
    if (fd != -1) {
        write(fd, "out", 3);
        close(fd);
    }
    printf("🟢 [Bare-Metal C Kernel] GPIO Pin %s initialized via sysfs.\n", GPIO_PIN);
}

// Write high/low value directly to hardware register
void set_gpio_value(int state) {
    int fd = open(GPIO_PATH, O_WRONLY);
    if (fd != -1) {
        if (state == 1) write(fd, "1", 1);
        else write(fd, "0", 1);
        close(fd);
    }
}

// Mutate Linux Cgroup CPU allocation
void update_cgroup_quota(int quota_us) {
    int fd = open(CGROUP_PATH, O_WRONLY);
    if (fd != -1) {
        char buf[32];
        snprintf(buf, sizeof(buf), "%d", quota_us);
        write(fd, buf, strlen(buf));
        close(fd);
        printf("⚙️ [Cgroup Mutation] Updated cpu.cfs_quota_us -> %d us\n", quota_us);
    }
}

int main() {
    printf("==================================================\n");
    printf("🚀 RISC-V Bare-Metal Kinetic Engine Initializing...\n");
    printf("==================================================\n");

    setup_gpio();

    int step = 0;
    int state = 0;
    int cloud_connected = 0; // Set to 0 to demonstrate Autonomous Offline Adaptation

    while (1) {
        state = !state;
        set_gpio_value(state);

        double base_freq = PI_DIGITS[step % PI_LEN] * 100.0;
        
        // AUTONOMOUS ADAPTATION TEST (Section 5):
        // If Cloud WebSocket is lost, daemon self-governs cgroups & system behavior autonomously
        if (!cloud_connected) {
            printf("⚠️ [AUTONOMOUS MODE] Offline condition detected! Reconfiguring local Cgroups...\n");
            update_cgroup_quota(20000 + (step % 5) * 5000); // Autonomous kernel mutation
        }

        printf("[RISC-V Kernel TX] Step %d | GPIO: %s | Freq: %.4f Hz | Autonomous Cgroup Active\n",
               step + 1, state ? "HIGH" : "LOW", base_freq);

        step++;
        usleep(1000000); // 1-second pulse interval
    }

    return 0;
}