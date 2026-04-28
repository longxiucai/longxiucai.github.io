## c程序打开多个文件
```
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>

int *fds = NULL;
int number_of_files = 0;
int last_files = 0;
void cleanup() {
    if (fds != NULL) {
        for (int i = 0; i < last_files + 1; i++) {
            if (fds[i] != -1) {
                close(fds[i]);
                printf("Closed file descriptor %d\n", fds[i]);
            }

            char filename[256];
            snprintf(filename, sizeof(filename), "/tmp/testfile_%d.txt", i);
            if (unlink(filename) == 0) {
                printf("Deleted file %s\n", filename);
            } else {
                perror("unlink");
            }
        }
        free(fds);
        fds = NULL;
        printf("Freed allocated memory\n");
    }
}

void signal_handler(int signal) {
    if (signal == SIGINT) {
        printf("\nCaught SIGINT signal, performing cleanup...\n");
        cleanup();
        exit(EXIT_FAILURE);
    }
}

void open_many_files(int num_files) {
    number_of_files = num_files;
    fds = malloc(number_of_files * sizeof(int));
    if (fds == NULL) {
        perror("malloc");
        exit(EXIT_FAILURE);
    }

    for (int i = 0; i < number_of_files; i++) {
        char filename[256];
        snprintf(filename, sizeof(filename), "/tmp/testfile_%d.txt", i);
        fds[i] = open(filename, O_RDWR | O_CREAT, 0644);
        if (fds[i] == -1) {
            perror("open");
            break;
        }
        printf("Opened file descriptor %d for %s\n", fds[i], filename);
        last_files = i;
    }
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: %s <number_of_files_to_open> <wait_time_in_seconds>\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    // Register the signal handler for SIGINT
    signal(SIGINT, signal_handler);

    int num_files_to_open = atoi(argv[1]);
    int wait_time = atoi(argv[2]);

    open_many_files(num_files_to_open);

    // Wait for the specified time before closing file descriptors
    printf("Waiting for %d seconds before closing file descriptors...\n", wait_time);
    sleep(wait_time);

    cleanup();

    return 0;
}
```
## 在pod中复现`too many open files in system`的情况
*  修改limit.conf中nofile，现在文件打开数量，在pod中不会报错，直接在宿主机中运行程序会报错
*  修改内核参数fs.file-max，降低值内核参数的值，pod中会报错