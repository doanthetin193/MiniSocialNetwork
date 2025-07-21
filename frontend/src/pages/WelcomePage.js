import React from 'react';
import { Link } from 'react-router-dom';
import styles from './WelcomePage.module.css';

const WelcomePage = () => {
  return (
    <div className={styles.welcomeContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.logoSection}>
              <div className={styles.logoIcon + ' ' + styles.animatedBounce}>🌟</div>
              <h1 className={styles.mainTitle + ' ' + styles.gradientText}>MiniSocial</h1>
              <p className={styles.mainSubtitle}>
                Nền tảng mạng xã hội mini - Kết nối, chia sẻ, và trò chuyện
              </p>
            </div>

            <div className={styles.actionButtons}>
              <Link to="/register" className={styles.primaryButton + ' ' + styles.animatedPulse}>
                <span className={styles.buttonIcon}>🚀</span>
                Tham gia ngay
              </Link>
              <Link to="/login" className={styles.secondaryButton}>
                <span className={styles.buttonIcon}>🔑</span>
                Đăng nhập
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.featuresShowcase}>
              <div className={styles.featureCard + ' ' + styles.featureCardLeft}>
                <div className={styles.featureIconCircle}><span className={styles.featureIcon}>💬</span></div>
                <h3>Chat Real-time</h3>
                <p>Trò chuyện trực tiếp với bạn bè</p>
              </div>
              <div className={styles.featureCard + ' ' + styles.featureCardCenter}>
                <div className={styles.featureIconCircle}><span className={styles.featureIcon}>📝</span></div>
                <h3>Chia sẻ bài viết</h3>
                <p>Đăng những khoảnh khắc đẹp</p>
              </div>
              <div className={styles.featureCard + ' ' + styles.featureCardRight}>
                <div className={styles.featureIconCircle}><span className={styles.featureIcon}>👥</span></div>
                <h3>Kết nối bạn bè</h3>
                <p>Tìm kiếm và theo dõi bạn bè</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle + ' ' + styles.gradientText2}>Tính năng nổi bật</h2>
          <p className={styles.sectionSubtitle}>
            Khám phá những tính năng tuyệt vời của MiniSocial
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Chat Real-time</h3>
            <p className={styles.featureDescription}>
              Nhắn tin trực tiếp với Socket.IO, thông báo typing indicators và trạng thái online/offline
            </p>
          </div>

          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp} style={{animationDelay: '0.1s'}}>
            <div className={styles.featureIcon}>📱</div>
            <h3 className={styles.featureTitle}>Responsive Design</h3>
            <p className={styles.featureDescription}>
              Giao diện thân thiện, hoạt động mượt mà trên mọi thiết bị mobile và desktop
            </p>
          </div>

          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp} style={{animationDelay: '0.2s'}}>
            <div className={styles.featureIcon}>🖼️</div>
            <h3 className={styles.featureTitle}>Chia sẻ hình ảnh</h3>
            <p className={styles.featureDescription}>
              Upload và chia sẻ hình ảnh dễ dàng với hệ thống lưu trữ an toàn
            </p>
          </div>

          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp} style={{animationDelay: '0.3s'}}>
            <div className={styles.featureIcon}>❤️</div>
            <h3 className={styles.featureTitle}>Tương tác bài viết</h3>
            <p className={styles.featureDescription}>
              Like, comment và chia sẻ những khoảnh khắc yêu thích với cộng đồng
            </p>
          </div>

          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp} style={{animationDelay: '0.4s'}}>
            <div className={styles.featureIcon}>👥</div>
            <h3 className={styles.featureTitle}>Quản lý bạn bè</h3>
            <p className={styles.featureDescription}>
              Tìm kiếm, kết nối và theo dõi những người bạn yêu thích
            </p>
          </div>

          <div className={styles.featureCard + ' ' + styles.cardShadow + ' ' + styles.fadeInUp} style={{animationDelay: '0.5s'}}>
            <div className={styles.featureIcon}>🔔</div>
            <h3 className={styles.featureTitle}>Thông báo real-time</h3>
            <p className={styles.featureDescription}>
              Nhận thông báo tức thời về tin nhắn mới, like và comment
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem + ' ' + styles.fadeInUp}>
            <div className={styles.statNumber}>1K+</div>
            <div className={styles.statLabel}>Người dùng</div>
          </div>
          <div className={styles.statItem + ' ' + styles.fadeInUp} style={{animationDelay: '0.1s'}}>
            <div className={styles.statNumber}>5K+</div>
            <div className={styles.statLabel}>Bài viết</div>
          </div>
          <div className={styles.statItem + ' ' + styles.fadeInUp} style={{animationDelay: '0.2s'}}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Tin nhắn</div>
          </div>
          <div className={styles.statItem + ' ' + styles.fadeInUp} style={{animationDelay: '0.3s'}}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Hỗ trợ</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={styles.ctaSection + ' ' + styles.ctaGradientBg}>
        <div className={styles.ctaContent + ' ' + styles.fadeInUp}>
          <h2 className={styles.ctaTitle + ' ' + styles.gradientText2}>Bắt đầu hành trình của bạn</h2>
          <p className={styles.ctaSubtitle}>
            Tham gia cộng đồng MiniSocial ngay hôm nay và khám phá những trải nghiệm tuyệt vời
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/register" className={styles.ctaPrimaryButton + ' ' + styles.animatedPulse}>
              Tạo tài khoản miễn phí
            </Link>
            <Link to="/login" className={styles.ctaSecondaryButton}>
              Đã có tài khoản
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoIcon}>🌟</span>
            <span className={styles.footerLogoText}>MiniSocial</span>
          </div>
          <p className={styles.footerText}>
            © 2025 MiniSocial. Nền tảng mạng xã hội mini cho mọi người.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
