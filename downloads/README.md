# WebDriverAgent IPA

`WebDriverAgentRunner-Runner-v16.12.10-unsigned.ipa` is an unsigned IPA wrapper around the official Appium WebDriverAgent v16.12.10 real-device bundle.

- Official release: https://github.com/appium/WebDriverAgent/releases/tag/v16.12.10
- Official source asset: `WebDriverAgentRunner-Runner.zip`
- Source SHA-256: `A708997F5E0E36EA397F1D84D0DFC68A636B132F589A050F0E2794675B68B2F9`
- IPA SHA-256: `BB6747EF12706EB33E30A5402819FCD868AADA2D5381A3FBE80A69313FFC5321`

The IPA is not pre-signed. Import it into SideStore so it can be signed for the target device with the user's own Apple Account. iOS 27 also requires a working RemoteXPC tunnel before Appium can launch the installed runner.
