使用以下配置metrics中全部指标正常
[root@amd ~]# cat filename.yml 
```
process_names:
  - name: "{{.Comm}}"
    cmdline:
    - '.+'
 ```
```
docker run -d  -p 9256:9256 --privileged -v /[proc:/host/proc](http://proc/host/proc) -v `pwd`:/config ncabatoff/process-exporter --procfs /host/proc -config.path /config/filename.yml
```

| 指标名称                                     | 描述                                                                                                   | 来源                                                                                                  |
|----------------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| namedprocess_namegroup_num_procs             | Number of processes in this group                                                                      | 程序累加                                                                                              |
| namedprocess_namegroup_cpu_seconds_total     | CPU user usage in seconds                                                                              | /proc/[pid]/stat 的 utime(14) 和 stime(15) 字段                                                        |
| namedprocess_namegroup_read_bytes_total      | Number of bytes read by this group                                                                     | /proc/[pid]/io 的 read_bytes 字段                                                                      |
| namedprocess_namegroup_write_bytes_total     | Number of bytes written by this group                                                                  | /proc/[pid]/io 的 write_bytes 字段                                                                     |
| namedprocess_namegroup_major_page_faults_total | Major page faults                                                                                     | /proc/[pid]/stat 的 majflt(12) 字段                                                                    |
| namedprocess_namegroup_minor_page_faults_total | Minor page faults                                                                                     | /proc/[pid]/stat 的 minflt(10) 字段                                                                    |
| namedprocess_namegroup_context_switches_total | Context switches                                                                                      | /proc/[pid]/status 的 voluntary_ctxt_switches 字段                                                     |
| namedprocess_namegroup_memory_bytes          | Number of bytes of memory in use                                                                       | resident: /proc/[pid]/stat 的 rss(24) 字段<br>virtual: /proc/[pid]/stat 的 vsize(23) 字段<br>swapped: /proc/[pid]/status 的 VmSwap 字段<br>proportionalResident: /proc/[pid]/smaps 的 "Pss" 字段之和<br>proportionalSwapped: /proc/[pid]/smaps 的 "SwapPss" 字段之和 |
| namedprocess_namegroup_open_filedesc         | Number of open file descriptors for this group                                                         | 计算目录 /proc/[pid]/fd 中有多少条目                                                                   |
| namedprocess_namegroup_worst_fd_ratio        | The worst (closest to 1) ratio between open fds and max fds among all procs in this group              | /proc/[pid]/limits 的 fd 软限制                                                                        |
| namedprocess_namegroup_oldest_start_time_seconds | Start time in seconds since 1970/01/01 of oldest process in group                                     | /proc/[pid]/stat 中的 starttime(22) 字段派生出来的                                                     |
| namedprocess_namegroup_num_threads           | Number of threads                                                                                      | Based on field num_threads(20) from /proc/[pid]/stat                                                  |
| namedprocess_namegroup_states                | Number of processes in states Running, Sleeping, Waiting, Zombie, or Other                             | /proc/[pid]/stat 的 num_threads(20) 字段                                                              |
| namedprocess_scrape_errors                   | General scrape errors: no proc metrics collected during a cycle                                        | 程序累加                                                                                              |
| namedprocess_scrape_procread_errors          | Incremented each time a proc's metrics collection fails                                                | 程序累加                                                                                              |
| namedprocess_scrape_partial_errors           | Incremented each time a tracked proc's metrics collection fails partially, e.g. unreadable I/O stats   | 程序累加                                                                                              |
| namedprocess_namegroup_threads_wchan         | Number of threads in this group waiting on each wchan                                                  | /proc/[pid]/wchan                                                                                     |
| namedprocess_namegroup_thread_count          | Number of threads in this group with same threadname                                                   | 程序累加                                                                                              |
| namedprocess_namegroup_thread_cpu_seconds_total | CPU user/system usage in seconds                                                                      | 与cpu_user_seconds_total和cpu_system_seconds_total相同，但分解为每个线程子组。与cpu_user_seconds_total/cpu_system_seconds_total不同的是，cpumode标签用于区分用户时间和系统时间。
| namedprocess_namegroup_thread_io_bytes_total | Number of bytes read/written by these threads                                                         | 与read_bytes_total和write_bytes_total相同，但分解为每个线程子组。与read_bytes_total/write_bytes_total不同的是，标签iomode用于区分读字节和写字节。
| namedprocess_namegroup_thread_major_page_faults_total | Major page faults for these threads                                                                 | 与 namedprocess_namegroup_major_page_faults_total 相同，但分解为每个线程子组                            |
| namedprocess_namegroup_thread_minor_page_faults_total | Minor page faults for these threads                                                                 | 与 namedprocess_namegroup_minor_page_faults_total 相同，但分解为每个线程子组                            |
| namedprocess_namegroup_thread_context_switches_total | Context switches for these threads                                                                   | 基于/proc/[pid]/status的voluntary_ctxt_switches和nonvoluntary_ctxt_switches.额外的标签ctxswitchtype可以有两个值:voluntary/nonvoluntary