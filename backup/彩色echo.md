```
################# color code ####################
RED="31;1m"      # Error message
GREEN="32;1m"    # Success message
YELLOW="33;1m"   # Warning message
BLUE="36;1m"     # Info message
LIGHT_BLUE="36m" # Debug message
################# color echo ####################
colorEcho() { echo -e "\033[${1}${@:2}\033[0m"; }
error() { colorEcho $RED $1; }
success() { colorEcho $GREEN $1; }
warn() { colorEcho $YELLOW $1; }
info() { colorEcho $BLUE $1; }
################ end of color echo ##############
```