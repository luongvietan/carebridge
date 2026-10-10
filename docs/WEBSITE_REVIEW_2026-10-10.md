# CareBridge Connect — review toàn bộ website

Ngày review: 10/10/2026  
Phạm vi: yêu cầu Portugal-first của khách hàng, website public, các journey professional/client/organisation/admin, launch readiness và chất lượng kỹ thuật.

## Kết luận

Website đã có đầy đủ khung marketplace và bản Portugal trong code. Các thay đổi readiness mới đã xử lý những lỗi code quan trọng: Portugal là market mặc định, UK đóng đăng ký, country được snapshot khi signup, redirect thanh toán theo đúng loại tài khoản, email có HTML thương hiệu và trạng thái delivery trung thực.

Chưa thể gọi là sẵn sàng launch hoặc bắt đầu trial 5 ứng viên. Bản deployed chưa được cập nhật từ branch hiện tại; website public vẫn dừng ở private-preview gate. Readiness command hiện trả exit code 1 một cách đúng chủ đích vì còn thiếu dữ liệu, pháp lý và secret production.

## Bằng chứng kiểm tra mới

| Kiểm tra | Kết quả |
|---|---|
| `npm test` | **Pass** — 64 test files, 442 tests; readiness policy 3/3 |
| `npm run lint` | **Pass** |
| `npm run build` | **Pass** — Next.js compile, TypeScript và 30 static pages |
| React Doctor | **87/100**, 21 cảnh báo maintainability; không có blocker correctness mới |
| `npm run readiness -w @carebridge/web` | **Fail đúng chủ đích** — còn thiếu launch inputs |
| Website production | Bị chặn tại `/gate`; chưa có gate code nên không thể walkthrough signed-in hoặc capture toàn bộ flow live |

## Những phần đã đáp ứng yêu cầu

1. **Portugal-first policy:** market parser mặc định PT và stale UK cookie không kéo public content về UK; UK không mở trong private preview. Xem [market.ts](../apps/web/src/lib/marketing/market.ts) và [market-server.ts](../apps/web/src/lib/marketing/market-server.ts).
2. **Account country integrity:** signup country được snapshot ở database và không cho user đổi; onboarding professional lấy country đã lưu thay vì cookie hiện tại. Xem migration [0089](../supabase/migrations/0089_portugal_first_launch.sql), [0091](../supabase/migrations/0091_signup_country_snapshot.sql) và [professional-session.ts](../apps/web/src/lib/onboarding/professional-session.ts).
3. **Organisation checkout:** success/cancel quay về `/organisation/bookings`; account không hợp lệ bị chặn trước khi tạo checkout. Xem [payments/actions.ts](../apps/web/src/lib/payments/actions.ts).
4. **Branded notification flow:** notification dùng HTML shell + plain text, escape nội dung, và không ghi `sent` khi email bị skip/fail. Xem [notifications/send.ts](../apps/web/src/lib/notifications/send.ts) và [email/render.ts](../apps/web/src/lib/email/render.ts).
5. **Contact acknowledgement:** enquiry được lưu độc lập với việc email acknowledgement có gửi thành công hay không. Xem [contact/actions.ts](../apps/web/src/lib/contact/actions.ts).
6. **Operations visibility:** `/admin/readiness` và script readiness không in secret/customer data, đồng thời kiểm tra market, role-bank và cấu hình vận hành.

## Các điểm còn lệch hoặc chưa đủ bằng chứng

### P0 — Chưa được launch

- Branch hiện tại chưa deploy; production vẫn có thể chạy code/database cũ.
- Database readiness cho thấy `GB.is_live=true`, `PT.is_live=false`; điều này phù hợp với trạng thái chưa được Ana phê duyệt, nhưng không phù hợp nếu khách hàng kỳ vọng Portugal đã mở.
- Không thể xác nhận onboarding, upload private documents, activation, payment thật, email inbox, cron và payout trên hosted environment trong lần review này.

### P1 — Cần input/phê duyệt của khách hàng

- Portugal có 20 câu common nhưng **0 câu specialist cho cả 8 role**; code đang bù thiếu bằng common questions. Cần question bank được Ana duyệt trước khi quảng bá assessment chuyên môn.
- `PAYOUT_ENC_KEY` và `CRON_SECRET` đang thiếu ở môi trường kiểm tra; Stripe key chưa phải live format.
- Địa chỉ công ty Portugal và thông tin RAL chưa cấu hình.
- Legal pages PT còn placeholder `[denominação social]`, `[NIPC]`, `[morada]`, `[comarca]`, processor/retention; cần company details và luật sư Portugal.
- Mức giá PT và childcare vẫn là working placeholders; cần phê duyệt bằng văn bản.
- `ANTHROPIC_API_KEY` chưa có; assistant vẫn chạy fallback keyword mode.

### P2 — UX/content cần hoàn thiện

- Cần walkthrough có gate code để xác nhận responsive/mobile, focus states, validation, empty/error states và toàn bộ signed-in navigation bằng screenshot hiện tại.
- React Doctor còn 21 cảnh báo maintainability, tập trung ở các page admin lớn, profile form, date picker và duplicate JSX. Đây chưa phải lỗi launch blocker nhưng nên tách thành đợt refactor sau readiness.
- Cần xác nhận Portuguese Supabase auth email/reset password end-to-end trên hosted project, không chỉ render/template test.
- Cần kiểm tra domain mới, DNS, Supabase redirect URLs, Resend sender và Stripe webhook sau khi Ana cung cấp quyền truy cập.

## Thứ tự xử lý đề xuất

1. Ana chốt legal entity, RAL/address, rates và specialist question bank PT.
2. Cấu hình secret production: payout encryption, cron, Stripe live/webhook và Resend sender; xác nhận domain/DNS.
3. Deploy branch sau khi review diff; chạy readiness và database/E2E trên môi trường test cách ly.
4. Walkthrough 5-candidate trial bằng tài khoản test: signup → onboarding → assessment → documents → approval → booking → payment → timesheet → payout.
5. Chỉ lift gate và bật `PT.is_live=true` sau khi checklist trên pass và có sign-off của Ana.

## Giới hạn

Đây là review code + readiness + kiểm tra trực tiếp trạng thái gate. Không có gate code, demo credentials hoặc quyền production nên chưa thể xác nhận hành vi sau đăng nhập, email thật, upload tài liệu, thanh toán thật hay dữ liệu trên mọi màn hình.

## Cập nhật sau đợt sửa

- Số điện thoại UK giả đã được loại khỏi public UI khi chưa có `NEXT_PUBLIC_UK_PHONE`; footer và trang Contact tự ẩn dòng trống.
- Readiness hiện kiểm tra thêm số điện thoại UK, trạng thái phê duyệt legal/rates và số active rate cards, đồng thời vẫn fail an toàn khi thiếu bất kỳ mục nào.
- `npm test`, `npm run lint`, `npm run build` đều pass; React Doctor trên phần thay đổi báo **No issues found**.
- Các mục còn lại không thể tự điền an toàn vì cần dữ liệu hoặc quyết định của khách hàng: pháp nhân/RAL, legal approval, rates approval, specialist question bank PT, Stripe live, payout/cron secrets, DNS và gate credentials.
