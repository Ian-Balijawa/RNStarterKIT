ANDROID_DIR ?= android
IOS_DIR     ?= ios

# Android application/package ID.
# Override this per project:
#
#   make android APP_ID=com.example.myapp
#
# Android application/package ID.
APP_ID ?= com.pidmis.yoya

# Output APK name.
# Override with:
#
#   make apk name=dev-ciems-v1.0.5.apk
#
name ?=

# React Native commands
YARN ?= yarn
NPM  ?= npm

# Build tools
GRADLE ?= ./gradlew

# Project name
PROJECT_NAME ?= $(shell basename "$(PWD)")

ANDROID_GRADLE := cd $(ANDROID_DIR) && $(GRADLE)

# Returns the UDID of:
#   1. Latest booted iOS simulator
#   2. Otherwise latest available iOS simulator
#
define get_ios_simulator
	$(shell \
		booted=$$(xcrun simctl list devices booted --json 2>/dev/null | \
			python3 -c " \
import sys, json; \
data=json.load(sys.stdin); \
devices=[(runtime,d) for runtime,devs in data.get('devices',{}).items() \
	for d in devs if 'iOS' in runtime]; \
devices.sort(key=lambda x:x[0],reverse=True); \
print(devices[0][1]['udid']) if devices else print('') \
			" 2>/dev/null); \
		if [ -n "$$booted" ]; then \
			echo "$$booted"; \
		else \
			xcrun simctl list devices available --json 2>/dev/null | \
			python3 -c " \
import sys, json; \
data=json.load(sys.stdin); \
devices=[(runtime,d) for runtime,devs in data.get('devices',{}).items() \
	for d in devs if 'iOS' in runtime and d.get('isAvailable',False)]; \
devices.sort(key=lambda x:x[0],reverse=True); \
print(devices[0][1]['udid']) if devices else print('') \
			" 2>/dev/null; \
		fi \
	)
endef

# Returns:
#   Device Name (iOS Version)
#
define get_ios_simulator_name
	$(shell \
		xcrun simctl list devices available --json 2>/dev/null | \
		python3 -c " \
import sys,json; \
data=json.load(sys.stdin); \
devices=[(runtime,d) for runtime,devs in data.get('devices',{}).items() \
	for d in devs if 'iOS' in runtime and d.get('isAvailable',False)]; \
devices.sort(key=lambda x:x[0],reverse=True); \
d=devices[0] if devices else None; \
runtime_label=d[0].replace('com.apple.CoreSimulator.SimRuntime.','').replace('-',' ') if d else ''; \
print(f'{d[1][\"name\"]} ({runtime_label})') if d else print('unknown') \
			" 2>/dev/null \
	)
endef

.PHONY: check-android
check-android:
	@if [ ! -d "$(ANDROID_DIR)" ]; then \
		echo "❌ Android directory not found: $(ANDROID_DIR)"; \
		exit 1; \
	fi

.PHONY: check-ios
check-ios:
	@if [ ! -d "$(IOS_DIR)" ]; then \
		echo "❌ iOS directory not found: $(IOS_DIR)"; \
		exit 1; \
	fi

.PHONY: check-app-id
check-app-id:
	@if [ -z "$(APP_ID)" ]; then \
		echo "❌ APP_ID is not configured."; \
		echo "Example: make android APP_ID=com.example.myapp"; \
		exit 1; \
	fi

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo ""
	@echo "============================================================"
	@echo "  $(PROJECT_NAME) - React Native Makefile"
	@echo "============================================================"
	@echo ""
	@echo "Configuration:"
	@echo "  APP_ID=$(APP_ID)"
	@echo "  ANDROID_DIR=$(ANDROID_DIR)"
	@echo "  IOS_DIR=$(IOS_DIR)"
	@echo ""
	@echo "Development:"
	@echo "  make start              Start Metro bundler"
	@echo "  make android            Run Android debug build"
	@echo "  make ios                Run iOS debug build"
	@echo "  make pods               Install iOS CocoaPods"
	@echo ""
	@echo "Build:"
	@echo "  make apk                Build release APK"
	@echo "  make bundle             Build release AAB"
	@echo "  make ios-build          Build iOS Release"
	@echo ""
	@echo "Installation:"
	@echo "  make install             Build and install APK"
	@echo "  make install-debug       Build and install debug APK"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean-android       Clean Android build"
	@echo "  make clean-ios           Clean iOS build"
	@echo "  make clean               Clean all builds"
	@echo "  make reset               Reset dependencies and builds"
	@echo "  make test                Run tests"
	@echo ""
	@echo "Examples:"
	@echo "  make android APP_ID=com.example.myapp"
	@echo "  make install APP_ID=com.example.myapp"
	@echo "  make ios IOS_SCHEME=MyApp"
	@echo ""

.PHONY: start
start:
	$(YARN) start

# Android Development
.PHONY: android
android: check-android check-app-id
	@echo "→ Starting Android development build"
	@echo "→ Application ID: $(APP_ID)"

	@adb kill-server >/dev/null 2>&1 || true
	@adb start-server >/dev/null

	@for device in $$(adb devices | awk 'NR>1 && $$2=="device" {print $$1}'); do \
		if adb -s $$device shell pm path "$(APP_ID)" >/dev/null 2>&1; then \
			echo "→ Uninstalling $(APP_ID) from $$device"; \
			adb -s $$device uninstall "$(APP_ID)" >/dev/null || true; \
		else \
			echo "→ $(APP_ID) not installed on $$device"; \
		fi; \
	done

	$(YARN) android

# iOS Development
.PHONY: ios
ios: check-ios
	$(eval SIM_UDID := $(call get_ios_simulator))
	$(eval SIM_NAME := $(call get_ios_simulator_name))

	@if [ -z "$(SIM_UDID)" ]; then \
		echo "❌ No iOS simulator found."; \
		echo "Open Xcode > Window > Devices and Simulators."; \
		exit 1; \
	fi

	@echo "→ Project: $(PROJECT_NAME)"
	@echo "→ Target simulator: $(SIM_NAME)"
	@echo "→ UDID: $(SIM_UDID)"

	cd $(IOS_DIR) && pod install

	$(YARN) ios --udid $(SIM_UDID)

# CocoaPods
.PHONY: pods
pods: check-ios
	@echo "→ Installing CocoaPods dependencies..."
	cd $(IOS_DIR) && pod install

# Release APK
.PHONY: apk
apk: check-android
	@echo "→ Building Android Release APK..."

	$(ANDROID_GRADLE) assembleRelease

	@APK_PATH=$$(find $(ANDROID_DIR)/app/build/outputs/apk/release \
		-type f -name "*.apk" | head -n 1); \
	\
	if [ -z "$$APK_PATH" ]; then \
		echo "❌ APK not found. Build may have failed."; \
		exit 1; \
	fi; \
	\
	if [ -n "$(name)" ]; then \
		OUTPUT_PATH="$(ANDROID_DIR)/app/build/outputs/apk/release/$(name)"; \
		\
		echo "→ Renaming APK:"; \
		echo "   From: $$APK_PATH"; \
		echo "   To:   $$OUTPUT_PATH"; \
		\
		mv "$$APK_PATH" "$$OUTPUT_PATH"; \
		\
		echo "✅ APK generated:"; \
		echo "   $$OUTPUT_PATH"; \
	else \
		echo "✅ APK generated:"; \
		echo "   $$APK_PATH"; \
	fi


# Release AAB
.PHONY: bundle
bundle: check-android
	@echo "→ Building Android Release AAB..."

	$(ANDROID_GRADLE) bundleRelease

	@AAB_PATH=$$(find $(ANDROID_DIR)/app/build/outputs/bundle \
		-type f -name "*.aab" | head -n 1); \
	\
	if [ -z "$$AAB_PATH" ]; then \
		echo "❌ AAB not found. Build may have failed."; \
		exit 1; \
	fi; \
	\
	echo "✅ AAB generated:"; \
	echo "   $$AAB_PATH"


# iOS BUILDS
.PHONY: ios-build
ios-build: check-ios
	$(eval SIM_UDID := $(call get_ios_simulator))
	$(eval SIM_NAME := $(call get_ios_simulator_name))

	@if [ -z "$(SIM_UDID)" ]; then \
		echo "❌ No iOS simulator found."; \
		exit 1; \
	fi

	@echo "→ Building $(PROJECT_NAME) for:"
	@echo "   Simulator: $(SIM_NAME)"
	@echo "   UDID: $(SIM_UDID)"

	cd $(IOS_DIR) && pod install

	cd $(IOS_DIR) && \
	xcodebuild \
		-workspace $$(find . -maxdepth 1 -name "*.xcworkspace" -print -quit) \
		-scheme "$$(find . -maxdepth 1 -name "*.xcodeproj" \
			-print -quit | xargs -n1 basename | sed 's/.xcodeproj//')" \
		-configuration Release \
		-destination "id=$(SIM_UDID)" \
		build


# INSTALLATION
# Install Release APK

.PHONY: install
install: check-android check-app-id
	@echo "→ Building release APK..."

	$(ANDROID_GRADLE) assembleRelease

	@APK_PATH=$$(find $(ANDROID_DIR)/app/build/outputs/apk/release \
		-type f -name "*.apk" | head -n 1); \
	\
	if [ -z "$$APK_PATH" ]; then \
		echo "❌ APK not found. Build may have failed."; \
		exit 1; \
	fi; \
	\
	echo "→ Using APK: $$APK_PATH"; \
	\
	adb kill-server >/dev/null 2>&1 || true; \
	adb start-server >/dev/null; \
	\
	DEVICES=$$(adb devices | awk 'NR>1 && $$2=="device" {print $$1}'); \
	\
	if [ -z "$$DEVICES" ]; then \
		echo "❌ No Android devices or emulators connected."; \
		exit 1; \
	fi; \
	\
	for device in $$DEVICES; do \
		echo ""; \
		echo "→ Processing device: $$device"; \
		\
		if adb -s $$device shell pm path "$(APP_ID)" >/dev/null 2>&1; then \
			echo "  - Uninstalling $(APP_ID)"; \
			adb -s $$device uninstall "$(APP_ID)" >/dev/null || true; \
		else \
			echo "  - $(APP_ID) not installed"; \
		fi; \
		\
		echo "  - Installing APK"; \
		adb -s $$device install "$$APK_PATH"; \
		\
		echo "  ✓ Installed on $$device"; \
	done


# Install Debug APK
.PHONY: install-debug
install-debug: check-android check-app-id
	@echo "→ Building debug APK..."

	$(ANDROID_GRADLE) assembleDebug

	@APK_PATH=$$(find $(ANDROID_DIR)/app/build/outputs/apk/debug \
		-type f -name "*.apk" | head -n 1); \
	\
	if [ -z "$$APK_PATH" ]; then \
		echo "❌ Debug APK not found."; \
		exit 1; \
	fi; \
	\
	echo "→ Installing: $$APK_PATH"; \
	\
	adb start-server >/dev/null; \
	\
	for device in $$(adb devices | awk 'NR>1 && $$2=="device" {print $$1}'); do \
		echo "→ Installing on $$device"; \
		adb -s $$device install -r "$$APK_PATH"; \
	done


# MAINTENANCE
# Clean Android
.PHONY: clean-android
clean-android: check-android
	@echo "→ Cleaning Android..."

	cd $(ANDROID_DIR) && ./gradlew clean

	rm -rf $(ANDROID_DIR)/.cxx
	rm -rf $(ANDROID_DIR)/app/.cxx
	rm -rf $(ANDROID_DIR)/app/build
	rm -rf $(ANDROID_DIR)/build

	@echo "✅ Android cleaned"


# Clean iOS
.PHONY: clean-ios
clean-ios: check-ios
	@echo "→ Cleaning iOS..."

	rm -rf $(IOS_DIR)/build

	cd $(IOS_DIR) && xcodebuild clean >/dev/null 2>&1 || true

	@echo "✅ iOS cleaned"


# Clean Everything
.PHONY: clean
clean: clean-android clean-ios
	@echo "✅ All builds cleaned"


# Full Reset
.PHONY: reset
reset:
	@echo "⚠️  Performing full React Native reset..."

	rm -rf node_modules

	rm -rf $(ANDROID_DIR)/.cxx
	rm -rf $(ANDROID_DIR)/app/.cxx
	rm -rf $(ANDROID_DIR)/app/build
	rm -rf $(ANDROID_DIR)/build

	rm -rf $(IOS_DIR)/Pods
	rm -rf $(IOS_DIR)/Podfile.lock
	rm -rf $(IOS_DIR)/build

	$(YARN) install

	cd $(IOS_DIR) && pod install

	cd $(ANDROID_DIR) && ./gradlew clean

	@echo "✅ Reset complete"

.PHONY: test
test:
	@echo "⚠️  Performing full test"

	npm run test

	@echo "✅ Test complete"

# INFORMATION
.PHONY: info
info:
	@echo ""
	@echo "Project information"
	@echo "-------------------"
	@echo "Project:       $(PROJECT_NAME)"
	@echo "Android dir:   $(ANDROID_DIR)"
	@echo "iOS dir:       $(IOS_DIR)"
	@echo "Android App ID: $(APP_ID)"
	@echo ""

.PHONY: devices
devices:
	@echo "Android devices:"
	@adb devices

	@echo ""
	@echo "iOS simulators:"
	@xcrun simctl list devices available | grep -E "iPhone|iPad" || true
