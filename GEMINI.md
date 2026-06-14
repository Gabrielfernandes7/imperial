# Project: Imperial

Imperial is a mobile application built with **React Native** and managed by **Expo**. It uses **TypeScript** for type safety and **Zustand** for state management.

## Tech Stack
- **Framework:** React Native (v0.81.5)
- **Tooling:** Expo (v54.0.34)
- **Language:** TypeScript
- **State Management:** Zustand
- **Components:** Expo Status Bar, standard React Native components

## Getting Started

### Prerequisites
- Node.js
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (for local testing)

### Building and Running
- **Start Development Server:** `npm start`
- **Run on Android:** `npm run android`
- **Run on iOS:** `npm run ios`
- **Run on Web:** `npm run web`

## Project Structure
- `index.ts`: The entry point of the application, registering the root component.
- `App.tsx`: The main application component.
- `assets/`: Contains images and icons for the application.
- `app.json`: Configuration for Expo.

## Development Conventions
- **TypeScript:** Use TypeScript for all new components and logic.
- **Components:** Functional components with hooks are preferred.
- **State Management:** Utilize Zustand for global state management where appropriate.
- **Styling:** Use `StyleSheet.create` for component-level styling.

## Important Note
Always refer to the exact versioned Expo documentation at [https://docs.expo.dev/versions/v54.0.0/](https://docs.expo.dev/versions/v54.0.0/) when making significant architectural or configuration changes.
