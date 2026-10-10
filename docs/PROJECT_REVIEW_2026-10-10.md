# Kiểm tra CareBridge Connect — 10/10/2026

## Kết luận

Project đã có các khối chức năng chính của marketplace, bản Portugal và công cụ vận hành. Các kiểm tra local chạy mới đều pass. Tuy nhiên, chưa đủ bằng chứng để gọi platform là sẵn sàng launch hoặc bảo đảm toàn bộ onboarding của 5 ứng viên sẽ chạy trơn tru. Yêu cầu mới của Ana về UK launching soon và bộ email thương hiệu chưa được hoàn thành.

Đây là bản kiểm tra, không phải thay đổi implementation hoặc phê duyệt go-live. Không có dữ liệu nghiệp vụ nào được sửa, tài khoản nào được tạo, email nào được gửi hoặc thanh toán nào được thực hiện trong lần kiểm tra này. Chỉ gửi một câu hỏi chung về đăng ký tới widget trợ lý trên website.

## Phạm vi và bằng chứng

- Đọc master implementation plan, Portugal launch runbook, platform review ngày 8/10, user guide và các luồng code chính: auth/RBAC, market selection, onboarding, assessment, compliance, booking, payments, payout, notifications, messaging, timesheets, reporting/export, assistant.
- Repository tại commit `f018f52`. Ban đầu có hai thư mục untracked `demo-kit/` và `graft/`; không sửa chúng.
- Kiểm tra website `https://www.carebridgeconnect.co.uk/` bằng Chrome của người dùng. Đọc homepage UK/PT, services UK, privacy UK/PT, professional registration PT và widget assistant.
- Build rồi chạy local tại `http://127.0.0.1:3001`, qua preview gate bình thường, đối chiếu homepage, registration và privacy. Truy cập `/admin` khi chưa đăng nhập được chuyển tới `/login`.
- Đọc các bảng cấu hình/tham chiếu trên Supabase mà `.env.local` trỏ tới: countries, professional_roles, assessment_question_bank (chỉ tổng hợp số lượng và kiểm tra cấu trúc options), rate_cards, notification_templates. Không đọc hồ sơ cá nhân hay chứng từ người dùng.
- Trình duyệt tự dịch một số trang sang tiếng Việt. Việc đó không được coi là lỗi locale của ứng dụng; trạng thái pt-PT được đối chiếu bằng nội dung trang trước khi dịch và code.

| Kiểm tra chạy mới | Kết quả |
|---|---|
| `npm test` | 55 files, 403 tests pass |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; compile và TypeScript pass |
| Production build local mở được | Có |
| E2E / pgTAP | Chưa chạy: Docker daemon không hoạt động |
| End-to-end đăng ký, email, upload, assessment, booking, payment | Chưa chạy trong lần kiểm tra này |

Local dùng Supabase hosted, không phải stack Supabase local cách ly. Vì vậy không chạy các bài test có tạo/xóa user hoặc đổi `countries.is_live` lên database này. Playwright config mặc định trỏ tới local stack, nhưng vẫn có khả năng nhận override từ environment; cần giữ database test tách biệt khi chạy lại.

## Kiến trúc và chức năng đã có trong code

Next.js 16.2.9 / React 19 / TypeScript; npm workspaces với app tại `apps/web`. Backend là Supabase Postgres/Auth/Storage; thanh toán qua Stripe, email notification qua Resend, hosting theo tài liệu là Vercel.

| Khu vực | Chức năng trong code |
|---|---|
| Public | Home, services, about, FAQ, contact, legal, country switch, trợ lý |
| Professional | Eligibility → assessment → profile → documents; nhiều vai trò; register verification; booking, earnings, payout details, messages |
| Client / organisation | Profile, booking request, booking history, Stripe checkout, timesheet confirmation, messages; organisation invoice |
| Admin | Dashboard, accounts, compliance, booking assignment, rates, finance/payouts, incidents, messages, audit và export |
| Database | RLS, compliance expiry sweep, audit, booking eligibility, rate snapshots, multi-role assignment rules |
| Portugal | pt-PT copy, NIF/NISS, Finanças activity, criminal records, professional registration, insurance, IBAN, EUR, organisation NIPC/ERS/ISS |

Payout hiện là ghi nhận và xác nhận bank transfer ngoài hệ thống; không phải tự động chuyển tiền cho professional. Messaging là member ↔ CareBridge, không phải client ↔ professional trực tiếp. Incidents là công cụ admin. Những điểm này cần phản ánh đúng trong lời giới thiệu cho Ana.

## Các khoảng thiếu đã xác nhận

### 1. Trạng thái thị trường chưa theo yêu cầu mới của Ana

Database trả về `GB.is_live = true`, `PT.is_live = false`. Homepage cho chọn UK bình thường, Portugal có nhãn preview. UK chưa hiển thị “Launching soon”.

Ngoài dữ liệu DB, code cũng mặc định GB: `lib/marketing/market.ts` và `market-server.ts`. `getSelectedCountry()` cho GB đi qua ngay, còn quốc gia khác kiểm tra `is_live` khi gate tắt. Vì vậy chỉ đổi cờ DB chưa đủ để chuyển trải nghiệm mặc định sang Portugal và đóng UK theo yêu cầu mới; cần review các guard, default market và CTA cùng nhau.

### 2. Assessment Portugal chưa có nội dung chuyên môn theo vai trò

Database có 8 vai trò PT active, 20 câu chung PT, nhưng **0 câu riêng cho từng vai trò PT**. Options của các câu active đọc được đều có cấu trúc `key` và `text`, nên lỗi blank answers trước đây không còn xuất hiện ở dữ liệu kiểm tra này.

`lib/assessment/actions.ts` và `selection.ts` cho phép bù phần câu riêng thiếu bằng câu chung. Vì vậy 8 nghề đang sử dụng bộ câu chung thay cho phần đánh giá chuyên môn riêng. Không nên giới thiệu phần assessment chuyên môn Portugal là hoàn tất trước khi Ana cung cấp hoặc duyệt question bank.

### 3. Email thương hiệu mới chỉ có một phần

- `supabase/templates/confirmation.html` và `recovery.html` **đã có HTML, logo, màu thương hiệu và nhánh ngôn ngữ PT/EN**. Chưa kiểm tra email thật từ hosted Supabase trong lần này.
- `lib/notifications/send.ts` gửi notification qua Resend với trường `text`, chưa dùng HTML shell theo thương hiệu. Database có 21 template en-GB và 21 template pt-PT.
- `lib/contact/actions.ts` chỉ insert vào `contact_messages`; chưa có acknowledgement email gửi người enquiry.
- Chưa tìm thấy bộ email signatures hoặc các mẫu enquiry theo yêu cầu ngày 9/10 của Ana trong các module email đã kiểm tra.

Do đó cần phân biệt phần auth email đã làm với bộ email mới mà Ana đang chờ.

### 4. Cấu hình local chưa đủ cho một số luồng

Chỉ báo trạng thái, không ghi secret vào báo cáo:

| Cấu hình local | Trạng thái / tác động |
|---|---|
| Stripe secret | Có định dạng test key; chưa kiểm tra key có hoạt động |
| Stripe webhook secret | Có cấu hình; chưa xác nhận endpoint giao nhận thật |
| Resend key / sender | Có cấu hình; chưa kiểm tra deliverability |
| `PAYOUT_ENC_KEY` | Trống; `savePayoutDetails()` trả lỗi trước khi lưu bank/IBAN |
| `ANTHROPIC_API_KEY` | Không có; assistant local dùng FAQ fallback |
| `CRON_SECRET` | Không có; endpoint reminder/auto-confirm local trả 503 |
| `NEXT_PUBLIC_APP_URL` | Trỏ tới website production; auth/payment redirect local sẽ về domain production |

Không suy diễn các giá trị này thành cấu hình Vercel production. Tài liệu review cũ ghi payment stub và assistant keyword mode, nhưng cấu hình deployed chưa được kiểm chứng trực tiếp trong lần này. Widget online trả lời được câu hỏi đăng ký bằng tiếng Portugal; UI không đủ để xác định model provider đang chạy.

### 5. Nội dung trước launch còn placeholder

- Privacy PT online có banner provisional và `[denominação social]`, `[NIPC]`, `[morada]`, phần processor/location và retention cần xác nhận.
- Footer PT online chỉ có địa chỉ “Portugal”; RAL đang dẫn tới danh sách chung thay vì một entity cụ thể.
- Privacy UK online là đoạn placeholder ngắn; số điện thoại UK là `+44 (0)161 000 0000`.
- Các social links online trỏ tới `#`.
- Cả 8 vai trò PT đã có rate cards EUR; giá hiện khớp giá placeholder trong migration `0080_euro_rate_cards.sql`. Chưa có bằng chứng trong lần kiểm tra này rằng Ana đã duyệt mức giá đó.

Đây là mô tả nội dung đang có, không phải xác nhận tính đầy đủ pháp lý.

## Các lỗi/rủi ro thấy từ code cần kiểm chứng thêm

1. **Country của professional có thể lệch market đăng ký.** Signup lưu `user_metadata.market` nhưng `ensureProfessional()` tạo profile với market cookie ở thời điểm bắt đầu onboarding (`professional-session.ts:33`). Nếu đăng ký PT rồi đổi cookie về GB trước lần tạo profile đầu tiên, có thể bị gán country GB. Cần test hồi quy với account test và lấy country từ thông tin signup đã lưu.
2. **Checkout organisation quay về khu vực client.** `payments/actions.ts:70–71` hard-code success/cancel URL về `/client/bookings`. RBAC không cho organisation vào khu vực đó, nên có thể chuyển họ về dashboard organisation thay vì trang booking và làm mất feedback payment. Chưa thực hiện giao dịch để tái hiện.
3. **Notification có thể bị ghi “sent” khi không có gửi email.** `recordOnlySender` là no-op; sau đó `sendNotification()` vẫn ghi status sent. Nhánh người dùng không có email cũng có thể đi tới sent. Cần phân biệt lưu record với đã giao email khi vận hành.

## Giới hạn của kết luận

- Các trang public đã kiểm tra khớp giữa local và website; chưa xác nhận hai bản cùng deployment SHA hoặc mọi trang signed-in đều giống nhau.
- Có code và unit tests không đồng nghĩa toàn bộ journey chạy được với hosted services.
- Chưa đăng nhập bằng tài khoản từng role, chưa kiểm tra inbox, upload private documents, activation/expiry cron, export download, live Stripe hoặc ownership/backups.
- E2E Portugal trong repo mới thấy phần public market switch; chưa thấy một suite Portugal onboarding → assessment → document review → activation hoàn chỉnh.
- CI hiện cài và chạy Chromium; các project Firefox/WebKit/mobile được định nghĩa nhưng chưa được chạy trong CI workflow hiện tại.
- `docs/USER_GUIDE.md` cũ: thứ tự onboarding khác guard hiện tại và ghi 9 export datasets, trong khi code đã có 13.

## Thứ tự xử lý đề xuất

1. Chốt trải nghiệm Portugal-first / UK launching soon; rà soát default market và guard trước khi đổi trạng thái deployed.
2. Dùng môi trường test cách ly để kiểm tra đầy đủ onboarding PT, country gán cho profile, assessment, email, documents và activation. Hoàn thiện question bank theo vai trò.
3. Kiểm tra và hoàn thiện cấu hình deployed cho payout encryption, email, cron và Stripe; xác nhận các redirect đúng từng role.
4. Hoàn thiện UI với designer, acknowledgement cho enquiries, notification HTML và signatures; review cùng logo/màu/copy.
5. Chốt giá, dữ liệu công ty, legal review, domain, quyền sở hữu và handover; sau đó đặt mốc trial dựa trên kết quả E2E thực tế.

Không nên hứa một ngày trial chỉ từ trạng thái build pass. Private trial có thể tách khỏi public launch, nhưng vẫn cần kiểm tra luồng đăng ký và dữ liệu mà nhóm thử nghiệm sẽ cung cấp.
