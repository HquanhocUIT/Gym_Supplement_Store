import { Link } from 'react-router-dom';

/**
 * LandingPage - Trang chủ công khai.
 * Giới thiệu gym và các tính năng chính.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f3] text-ink">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#18251f] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Xây dựng cơ thể lý tưởng của bạn
          </h1>
          <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
            Các gói tập linh hoạt, thiết bị hiện đại và đội ngũ huấn luyện viên chuyên nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="px-8 py-4 bg-[#84cc16] text-white rounded-xl font-bold hover:bg-[#7cac2c] transition-colors"
            >
              Xem gói tập
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-white text-white rounded-xl font-bold hover:bg-white hover:text-[#18251f] transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-12">Tại sao chọn chúng tôi?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-[#e3e9e1] bg-white">
              <div className="text-[#84cc16] text-4xl mb-4">🏋️</div>
              <h3 className="text-lg font-bold text-ink mb-2">Thiết bị hiện đại</h3>
              <p className="text-sm text-muted">Hệ thống tập gym đầy đủ, hiện đại và an toàn.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-[#e3e9e1] bg-white">
              <div className="text-[#84cc16] text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-lg font-bold text-ink mb-2">Huấn luyện viên</h3>
              <p className="text-sm text-muted">Đội ngũ coach chuyên nghiệp, tận tâm.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-[#e3e9e1] bg-white">
              <div className="text-[#84cc16] text-4xl mb-4">📱</div>
              <h3 className="text-lg font-bold text-ink mb-2">Đăng ký dễ dàng</h3>
              <p className="text-sm text-muted">Đăng ký gói tập online trong vài phút.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-ink mb-4">Sẵn sàng bắt đầu chưa?</h2>
          <p className="text-muted mb-6">Tham gia cộng đồng thành viên của chúng tôi hôm nay.</p>
          <Link
            to="/register"
            className="px-8 py-4 bg-[#84cc16] text-white rounded-xl font-bold hover:bg-[#7cac2c] transition-colors"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>
    </div>
  );
}
