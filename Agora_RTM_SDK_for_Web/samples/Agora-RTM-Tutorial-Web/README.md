# Web Tutorial For Webpack - Agora Web RTM

*English | [中文](README.zh.md)*

This tutorial shows you how to quickly integrate Agora Web RTM SDK with the Agora sample app.
This demo contains following features:

- Login & Logout:
- Join & Leave Channel:
- Query Peer User online status:
- Send P2P Message:
- Send Channel Message:

## Prerequisites

- nodejs LTS
- A web browser

## Quick Start

This section shows you how to prepare, and run the sample application.

### Obtain an App ID

To build and run the sample application, get an App ID:
1. Create a developer account at [agora.io](https://dashboard.agora.io/signin/). Once you finish the signup process, you will be redirected to the Dashboard.
2. Navigate in the Dashboard tree on the left to **Projects** > **Project List**.
3. Save the **App ID** from the Dashboard for later use.
4. Generate a temp **Access Token** (valid for 24 hours) from dashboard page with given channel name, save for later use.


### Install dependencies and integrate the Agora Video SDK

1. Using the Terminal app, enter the `install` command in your project directory. This command installs libraries that are required to run the sample application.
    ``` bash
    # install dependencies
    npm install
    ```
2. Start the application by entering the `run dev` or `run build` command.
    The `run dev` command is for development purposes.
    ``` bash
    # serve with hot reload at localhost:8080
    npm run dev
    ```
    The `run build` command is for production purposes and minifies code.
    ``` bash
    # build for production with minification
    npm run build
    ```
3. Your default browser should open and display the sample application, as shown here.
    **Note:** In some cases, you may need to open a browser and enter `http://localhost:8080` as the URL.

## Resources

- You can find full API document at [Document Center](https://docs.agora.io/en/)
- You can file bugs about this demo at [issue](https://github.com/AgoraIO/RTM/issues)

## License

The MIT License (MIT)
