```
#!/bin/bash
start_branch=v1.30.7
end_bransh=release-4.17
input_file="input.txt"
git log $(git merge-base $start_branch $end_bransh)..$end_bransh --oneline --reverse --no-merges |grep carry > $input_file
output_file="output.tsv"
# 遍历每一行，提取 commit 和 message，并获取 diff 文件内容
while IFS= read -r line; do
    # 提取 commit 和 message
    commit=$(echo "$line" | awk '{print $1}')
    message=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ *//')
    # 获取 diff 文件内容
    diff_output=$(git show $commit|grep "^diff"|cut -d " " -f3|cut -d "/" -f 2-)
    # 拼接输出内容并写入文件
    echo -e "$commit\t$message\t\"$diff_output\"" >> "$output_file"
done < "$input_file"

echo "已完成处理，结果保存到 $output_file"
```