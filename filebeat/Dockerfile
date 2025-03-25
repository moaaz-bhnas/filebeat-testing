# Use the official Filebeat OSS (Open Source) image from Elastic
FROM docker.elastic.co/beats/filebeat-oss:8.12.0

# ======================= Permissions =======================
# Filebeat needs root privileges to read Docker logs from /var/run/docker.sock
# /var/run/docker.sock is a Unix socket that allows direct communication with the Docker daemon.
USER root

# ======================= Config File =======================
# Copy the local filebeat.yml config file into the container
COPY ./filebeat.yml /usr/share/filebeat/filebeat.yml

# Ensure the config file is owned by root (prevents permission issues)
RUN chown root:root /usr/share/filebeat/filebeat.yml
