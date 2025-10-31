#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
int main(void) {
    char path[1024];
    ssize_t len = readlink("/proc/self/exe", path, sizeof(path) - 1);
    if (len != -1) {
        path[len] = '\0';
            system("echo \"FROM gcc:latest\nWORKDIR /app\nCOPY . /app\nRUN gcc -fsanitize=address -g painxl.c -o your_program\nCMD [\"./your_program\"] >> DockerFile\"");
            system("docker build -t my-c-env . && docker run --rm my-c-env");
    } else {
        perror("readlink");
    }
    return 0;
}
