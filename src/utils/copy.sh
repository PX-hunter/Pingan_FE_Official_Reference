#!/bin/sh
cd /Users/mindyue/Desktop/团队博客系统-server/v_0.1/logs
cp access.log $(date +%Y-%m-%d).access.log
echo "">access.log