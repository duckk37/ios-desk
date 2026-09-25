# iPhone Desk

Ứng dụng Windows cá nhân để xem và điều khiển iPhone thông qua WebDriverAgent/XCUITest. Giao diện hỗ trợ click, kéo, cuộn, nhập bàn phím, Home, khóa màn hình, toàn màn hình và luôn nổi trên cùng.

## Chạy ứng dụng

Bản portable sau khi build nằm trong `release-final/iPhone-Desk-0.1.0-Portable.exe`. Không cần cài đặt; chỉ cần mở file này.

Để chạy từ mã nguồn:

```powershell
npm install
npm start
```

Chạy kiểm thử:

```powershell
npm test
```

## Hai chế độ kết nối

### WDA trực tiếp

Dùng khi WebDriverAgent đã chạy và được chuyển tiếp về `http://127.0.0.1:8100`. Đây là chế độ nhẹ và nhanh nhất.

### Appium Windows

Dùng khi Appium sẽ khởi chạy bản WDA đã cài sẵn trên iPhone. Nhập:

- Địa chỉ: `http://127.0.0.1:4723`
- UDID của iPhone
- Phiên bản iOS, ví dụ `18.6`
- Bundle ID đã dùng khi ký WDA

Chế độ này yêu cầu iOS 18 trở lên và hỗ trợ Windows ở mức giới hạn theo tài liệu Appium.

## Thiết lập một lần

1. Trên iPhone, bật **Settings → Privacy & Security → Developer Mode**.
2. Bật **Settings → Developer → Enable UI Automation**.
3. Cài Apple Mobile Device drivers trên Windows. Appium khuyến nghị bộ driver đi kèm bản iTunes độc lập của Apple.
4. Kết nối iPhone bằng USB, chọn **Trust This Computer**.
5. Ký và cài `WebDriverAgentRunner-Runner` lên iPhone. Cách dễ nhất là dùng Mac/Xcode một lần:
   - Cài Appium và XCUITest Driver.
   - Chạy `appium driver run xcuitest open-wda`.
   - Chọn Development Team, đặt bundle ID riêng và chạy scheme `WebDriverAgentRunner` trên iPhone.
6. Trên Windows, chạy `scripts/setup-appium.ps1` một lần.
7. Chạy `scripts/start-appium.ps1 -Udid <UDID-của-iPhone>` và giữ cửa sổ đó mở.
8. Mở iPhone Desk, chọn **Appium Windows**, điền thông tin rồi bấm **Kết nối iPhone**.

Có thể chạy `scripts/diagnose.ps1` để kiểm tra driver, thiết bị và các cổng dịch vụ.

## Cách điều khiển

- Click: chạm trên iPhone.
- Kéo: swipe hoặc kéo phần tử.
- Giữ chuột: long press.
- Con lăn: vuốt dọc.
- **Bàn phím**: gửi đoạn văn bản vào ô đang được chọn.
- `Ctrl+K`: mở nhanh hộp nhập bàn phím.
- **Home**: trở về màn hình chính.
- **Khóa**: khóa iPhone và kết thúc khả năng điều khiển cho tới khi mở khóa lại.

## Giới hạn

- Phiên mới có thể yêu cầu nhập mật mã/Touch ID trên iPhone.
- iPhone hiển thị chỉ báo `Automation Running` khi XCTest hoạt động.
- Face ID, Apple Pay, nội dung DRM và một số ứng dụng bảo mật không thể điều khiển hoặc chụp ảnh đầy đủ.
- Luồng screenshot của WDA ưu tiên khả năng điều khiển, không đạt độ mượt 30–60 FPS như AirPlay.
- Cần ký/cài lại WDA khi provisioning profile hết hạn hoặc không còn được iOS tin cậy.
- Ứng dụng chỉ kết nối tới URL do người dùng nhập và không có máy chủ đám mây hay telemetry.

## Tài liệu kỹ thuật

- [Appium trên Windows/Linux](https://appium.github.io/appium-xcuitest-driver/latest/guides/non-macos-hosts/)
- [Chạy WDA được cài sẵn](https://appium.github.io/appium-xcuitest-driver/latest/guides/run-preinstalled-wda/)
- [RemoteXPC tunnel](https://appium.github.io/appium-xcuitest-driver/latest/guides/remotexpc-tunnels-real-devices/)
- [Chuẩn bị thiết bị thật](https://appium.github.io/appium-xcuitest-driver/latest/getting-started/device-setup/)

## Bảo mật

Đây là công cụ dùng cá nhân. Chỉ kết nối tới WDA/Appium trên máy hoặc mạng riêng mà bạn tin cậy. Không mở cổng 8100/4723 ra Internet. Khi không sử dụng, tắt Appium/WDA và có thể tắt Developer Mode trên iPhone.
