ANDROID_DIR ?= android
IOS_DIR ?= ios
APP_ID ?= com.starterapp
IOS_SCHEME ?= starterapp
IOS_WORKSPACE ?= starterapp.xcworkspace
IOS_UDID ?=
IOS_DESTINATION ?= generic/platform=iOS Simulator

NPM ?= npm
GRADLE ?= ./gradlew
ADB ?= adb

# Optional filename for a copy of the release APK: make apk name=starterapp.apk
name ?=

ANDROID_GRADLE = cd "$(ANDROID_DIR)" && $(GRADLE)
DEBUG_APK = $(ANDROID_DIR)/app/build/outputs/apk/debug/app-debug.apk
RELEASE_APK = $(ANDROID_DIR)/app/build/outputs/apk/release/app-release.apk
RELEASE_AAB = $(ANDROID_DIR)/app/build/outputs/bundle/release/app-release.aab
PODS_MANIFEST = $(IOS_DIR)/Pods/Manifest.lock

.DEFAULT_GOAL := help
.PHONY: help check-android check-ios start android ios pods apk bundle ios-build \
        install install-debug clean-android clean-ios clean reset test lint \
        typecheck check info devices

help:
	@echo "starterapp commands"
	@echo ""
	@echo "  make start           Start Metro"
	@echo "  make android         Build and run Android debug app"
	@echo "  make ios             Build and run iOS debug app"
	@echo "  make pods            Install or refresh iOS pods"
	@echo "  make apk             Build release APK"
	@echo "  make bundle          Build release AAB"
	@echo "  make ios-build       Build iOS Release for simulator"
	@echo "  make install         Build and install release APK"
	@echo "  make install-debug   Build and install debug APK"
	@echo "  make test            Run Jest tests"
	@echo "  make lint            Run ESLint"
	@echo "  make typecheck       Run TypeScript checks"
	@echo "  make check           Run all three checks"
	@echo "  make clean           Clean Android and iOS builds"
	@echo "  make reset           Reinstall npm packages and pods"
	@echo "  make info            Show project settings"
	@echo "  make devices         List Android devices and iOS simulators"
	@echo ""
	@echo "Overrides: APP_ID=$(APP_ID), IOS_SCHEME=$(IOS_SCHEME), IOS_UDID=<simulator UDID>"
	@echo "Examples: make apk name=starterapp-v1.apk"
	@echo "          make ios IOS_UDID=<simulator UDID>"

check-android:
	@test -f "$(ANDROID_DIR)/gradlew" || { echo "Android Gradle wrapper not found in $(ANDROID_DIR)"; exit 1; }

check-ios:
	@test -f "$(IOS_DIR)/Podfile" || { echo "iOS Podfile not found in $(IOS_DIR)"; exit 1; }

start:
	$(NPM) start

# APP_ID tells the CLI which installed package to launch. To rename the
# package itself, change applicationId in android/app/build.gradle too.
android: check-android
	$(NPM) run android -- --appId "$(APP_ID)"

$(PODS_MANIFEST): $(IOS_DIR)/Podfile package-lock.json
	cd "$(IOS_DIR)" && pod install

pods: check-ios
	cd "$(IOS_DIR)" && pod install

# React Native chooses an available simulator unless IOS_UDID is supplied.
ios: check-ios $(PODS_MANIFEST)
	$(NPM) run ios -- --scheme "$(IOS_SCHEME)" $(if $(IOS_UDID),--udid "$(IOS_UDID)")

apk: check-android
	$(ANDROID_GRADLE) :app:assembleRelease
	@test -f "$(RELEASE_APK)" || { echo "Release APK not found: $(RELEASE_APK)"; exit 1; }
	@if [ -n "$(name)" ]; then \
		cp "$(RELEASE_APK)" "$(ANDROID_DIR)/app/build/outputs/apk/release/$(name)"; \
		echo "APK: $(ANDROID_DIR)/app/build/outputs/apk/release/$(name)"; \
	else \
		echo "APK: $(RELEASE_APK)"; \
	fi

bundle: check-android
	$(ANDROID_GRADLE) :app:bundleRelease
	@test -f "$(RELEASE_AAB)" || { echo "Release AAB not found: $(RELEASE_AAB)"; exit 1; }
	@echo "AAB: $(RELEASE_AAB)"

# A generic simulator destination works without a booted simulator.
ios-build: check-ios $(PODS_MANIFEST)
	cd "$(IOS_DIR)" && xcodebuild \
		-workspace "$(IOS_WORKSPACE)" \
		-scheme "$(IOS_SCHEME)" \
		-configuration Release \
		-destination "$(IOS_DESTINATION)" \
		CODE_SIGNING_ALLOWED=NO build

# adb install -r updates the app without deleting its data.
install: apk
	@set -eu; \
		$(ADB) start-server >/dev/null; \
		devices=$$($(ADB) devices | awk 'NR > 1 && $$2 == "device" { print $$1 }'); \
		if [ -z "$$devices" ]; then echo "No Android devices or emulators connected"; exit 1; fi; \
		for device in $$devices; do \
			echo "Installing $(RELEASE_APK) on $$device"; \
			$(ADB) -s "$$device" install -r "$(RELEASE_APK)"; \
			path=$$($(ADB) -s "$$device" shell pm path "$(APP_ID)"); \
			if [ -z "$$path" ]; then echo "Package $(APP_ID) not found on $$device"; exit 1; fi; \
		done

install-debug: check-android
	$(ANDROID_GRADLE) :app:assembleDebug
	@test -f "$(DEBUG_APK)" || { echo "Debug APK not found: $(DEBUG_APK)"; exit 1; }
	@set -eu; \
		$(ADB) start-server >/dev/null; \
		devices=$$($(ADB) devices | awk 'NR > 1 && $$2 == "device" { print $$1 }'); \
		if [ -z "$$devices" ]; then echo "No Android devices or emulators connected"; exit 1; fi; \
		for device in $$devices; do \
			echo "Installing $(DEBUG_APK) on $$device"; \
			$(ADB) -s "$$device" install -r "$(DEBUG_APK)"; \
			path=$$($(ADB) -s "$$device" shell pm path "$(APP_ID)"); \
			if [ -z "$$path" ]; then echo "Package $(APP_ID) not found on $$device"; exit 1; fi; \
		done

clean-android: check-android
	$(ANDROID_GRADLE) clean
	rm -rf "$(ANDROID_DIR)/.cxx" "$(ANDROID_DIR)/app/.cxx"

clean-ios: check-ios
	cd "$(IOS_DIR)" && xcodebuild -workspace "$(IOS_WORKSPACE)" -scheme "$(IOS_SCHEME)" clean
	rm -rf "$(IOS_DIR)/build"

clean: clean-android clean-ios

# Keep package-lock.json and Podfile.lock so reset remains reproducible.
reset:
	rm -rf node_modules "$(ANDROID_DIR)/.cxx" "$(ANDROID_DIR)/app/.cxx" \
		"$(ANDROID_DIR)/app/build" "$(ANDROID_DIR)/build" "$(IOS_DIR)/Pods" "$(IOS_DIR)/build"
	$(NPM) ci
	cd "$(IOS_DIR)" && pod install

test:
	$(NPM) test -- --runInBand --watchman=false

lint:
	$(NPM) run lint

typecheck:
	npx tsc --noEmit

check: typecheck lint test

info:
	@echo "Project: starterapp"
	@echo "Android application ID: $(APP_ID)"
	@echo "Android directory: $(ANDROID_DIR)"
	@echo "iOS directory: $(IOS_DIR)"
	@echo "iOS scheme: $(IOS_SCHEME)"
	@echo "iOS workspace: $(IOS_WORKSPACE)"
	@echo "iOS build destination: $(IOS_DESTINATION)"

devices:
	@echo "Android devices:"
	@$(ADB) devices
	@echo "iOS simulators:"
	@xcrun simctl list devices available
