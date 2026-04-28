指标名称|描述|	来源|	是否需要添加运行参数
--------- | --------|--------|--------|
systemd_process_open_fds|	Number of open file descriptors	|/proc/<pid>/fd/*   数量|	--systemd.collector.enable-file-descriptor-size
systemd_service_ip_egress_bytes|	Service unit egress IP accounting in bytes	|dbus Service类型 IPEgressBytes属性	|--systemd.collector.enable-ip-accounting
systemd_service_ip_egress_packets_total|	Service unit egress IP accounting in packets|	dbus Service类型 IPEgressPackets属性|--systemd.collector.enable-ip-accounting
systemd_service_ip_ingress_bytes|	Service unit ingress IP accounting in bytes|	dbus Service类型 IPIngressBytes属性|--systemd.collector.enable-ip-accounting
systemd_service_ip_ingress_packets_total|	Service unit ingress IP accounting in packets|	dbus Service类型 IPIngressPackets属性|--systemd.collector.enable-ip-accounting
systemd_service_restart_total|	Service unit count of Restart triggers|	dbus Service类型 NRestarts属性|	--systemd.collector.enable-restart-count
systemd_exporter_build_info|	A metric with a constant '1' value labeled by version, revision, branch, and goversion from which systemd_exporter was built.	|| 否
systemd_process_cpu_seconds_total|	Total user and system CPU time spent in seconds|	/proc/<pid>/stat中第14与15个值的和再除以100	|否
systemd_process_max_fds|	Maximum number of open file descriptors	| /proc/<pid>/limits中‘Max open files’的‘Soft Limit’值	|否
systemd_process_resident_memory_bytes|	Resident memory size in bytes|	/proc/<pid>/stat中第24个值乘pagesize	|否
systemd_process_virtual_memory_bytes|	Virtual memory size in bytes|	/proc/<pid>/stat中第23个值	|否
systemd_process_virtual_memory_max_bytes|	Maximum amount of virtual memory available in bytes|	/proc/<pid>/limits中‘Max address space’的‘Soft Limit’值	|否
systemd_socket_accepted_connections_total|	Total number of accepted socket connections|	dbus Service类型 NAccepted属性	|否
systemd_socket_current_connections|	Current number of socket connections|	dbus Service类型 NConnections属性	|否
systemd_socket_refused_connections_total|	Total number of refused socket connections|	dbus Service类型 NRefused属性	|否
systemd_timer_last_trigger_seconds|	Seconds since epoch of last trigger.|	dbus Timer类型 LastTriggerUSec属性再除以1e6	|否
systemd_unit_cpu_seconds_total|	Unit CPU time in seconds|	cgroup中的cpuacct.usage_all	|否
systemd_unit_info|	Mostly-static metadata for all unit types|	dbus Service类型 Type属性、servicename	|否
systemd_unit_start_time_seconds|	Start time of the unit since unix epoch in seconds|	dbus Service类型 ActiveEnterTimestamp属性再除以1e6	|否
systemd_unit_state|	Systemd unit|	dbus连接获取服务列表时的值	|否
systemd_unit_tasks_current|	Current number of tasks per Systemd unit|	dbus Service类型 TasksCurrent属性	|否
systemd_unit_tasks_max|	Maximum number of tasks per Systemd unit|	dbus Service类型 TasksMax属性	|否