#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current timestamp for log file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$(pwd)/logs/build_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Start logging
touch "$LOG_FILE"
log "Starting iOS build process..."

# List available simulators
log "Available simulators:"
xcrun simctl list devices >> "$LOG_FILE" 2>&1

# Clean the project
log "Cleaning project..."
cd ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Debug >> "$LOG_FILE" 2>&1

# Remove derived data
log "Removing derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

# Reinstall pods
log "Reinstalling pods..."
pod deintegrate >> "$LOG_FILE" 2>&1
pod install >> "$LOG_FILE" 2>&1

# Build the project with detailed logging
log "Building project..."
xcodebuild -workspace App.xcworkspace \
          -scheme App \
          -configuration Debug \
          -destination 'platform=iOS Simulator,id=C1FDBB11-3135-421F-BD9D-96E403E7FFF9' \
          -verbose \
          CODE_SIGN_IDENTITY="" \
          CODE_SIGNING_REQUIRED=NO \
          CODE_SIGNING_ALLOWED=NO \
          >> "$LOG_FILE" 2>&1

BUILD_RESULT=$?

# Return to original directory
cd ../..

# Check build result
if [ $BUILD_RESULT -eq 0 ]; then
    log "Build completed successfully!"
    # Open Xcode with the simulator
    open ios/App/App.xcworkspace
else
    log "Build failed. Check the log file for details: $LOG_FILE"
    # Extract error messages
    grep -i "error:" "$LOG_FILE" > "logs/errors_${TIMESTAMP}.log"
    grep -i "warning:" "$LOG_FILE" > "logs/warnings_${TIMESTAMP}.log"
    
    # Additional error details
    echo "=== Build Configuration ===" >> "logs/errors_${TIMESTAMP}.log"
    echo "Xcode Version:" >> "logs/errors_${TIMESTAMP}.log"
    xcodebuild -version >> "logs/errors_${TIMESTAMP}.log" 2>&1
    echo "=== Available Simulators ===" >> "logs/errors_${TIMESTAMP}.log"
    xcrun simctl list devices >> "logs/errors_${TIMESTAMP}.log" 2>&1
    echo "=== Full Build Log ===" >> "logs/errors_${TIMESTAMP}.log"
    tail -n 100 "$LOG_FILE" >> "logs/errors_${TIMESTAMP}.log"
fi

log "Build process completed. Log file: $LOG_FILE"

# Additional steps for npm
log "Running npm install..."
npm install

log "Running npm build..."
npm run build

log "Running npm dev..."
npm run dev

log "Additional build steps completed."

npx cap sync 

brew install cocoapods 

pod init 

open -a Xcode Podfile 