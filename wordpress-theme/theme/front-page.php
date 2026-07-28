<?php
/**
 * صفحه‌ی اصلیِ سینمایی SilvershopIR
 * ساختار و طراحی همان سایتِ استاتیکِ اصلی است؛ فقط سه بخشِ محصول از
 * نوع‌نوشته‌ی «ss_product» (که خودِ فروشگاه از پنل مدیریت می‌سازد) خوانده می‌شود.
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$p_mardane = silvershop_get_category_product( 'mardane' );
$p_zanane  = silvershop_get_category_product( 'zanane' );
$p_halfset = silvershop_get_category_product( 'halfset' );

function ss_product_block( $post, $fallback_img, $fallback_alt, $fallback_title, $fallback_body ) {
	if ( $post ) {
		$img   = get_the_post_thumbnail_url( $post, 'large' ) ?: $fallback_img;
		$alt   = get_the_title( $post );
		$title = get_the_title( $post );
		$body  = wp_strip_all_tags( $post->post_content );
		$body  = mb_strlen( $body ) > 180 ? mb_substr( $body, 0, 180 ) . '…' : $body;
		$link  = get_permalink( $post );
		$wa    = silvershop_whatsapp_link( $title );
	} else {
		$img = $fallback_img; $alt = $fallback_alt; $title = $fallback_title; $body = $fallback_body;
		$link = home_url( '/products/' );
		$wa   = silvershop_whatsapp_link( $fallback_title );
	}
	return compact( 'img', 'alt', 'title', 'body', 'link', 'wa' );
}

$b1 = ss_product_block( $p_mardane, get_site_url( null, '/assets/img/product-ring-men.webp' ), 'انگشتر مردانه نقره با نگین فیروزه و رکاب قلم‌زنی', 'انگشتر مردانه', 'صلابت و اصالت؛ رکاب‌های پهنِ قلم‌زنی‌شده با نگین‌های فیروزه، عقیق و اونیکس — برای سلیقه‌های کلاسیک و امروزی.' );
$b2 = ss_product_block( $p_zanane,  get_site_url( null, '/assets/img/product-ring-women.webp' ), 'انگشتر زنانه نقره با نگین سبز زمردی', 'انگشتر زنانه', 'ظرافتِ نقره در رکاب‌های باریکِ نگین‌کاری‌شده؛ از نگین‌های زمردی تا سولیترهای کلاسیک و طرح‌های مینیمال.' );
$b3 = ss_product_block( $p_halfset, get_site_url( null, '/assets/img/halfset.svg' ), 'نیم‌ست زنانه نقره', 'نیم‌ست زنانه', 'هماهنگیِ کامل گردنبند و گوشواره؛ نیم‌ست‌هایی که برای هدیه دادن و لحظه‌های خاص ساخته شده‌اند.' );
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl" <?php language_attributes(); ?>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SilvershopIR — فروشگاه زیورآلات نقره اصفهان</title>
  <meta name="description" content="فروشگاه زیورآلات نقره ۹۲۵ در اصفهان — انگشتر مردانه، انگشتر زنانه و نیم‌ست زنانه. مجموعه نقش جهان، اتوبان چمران.">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23C9CCD1' stroke-width='4'/%3E%3C/svg%3E">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

  <!-- ۱. لودر -->
  <div id="loader" aria-hidden="true">
    <div class="loader-brand"><span class="latin">SilvershopIR</span><span class="fa">نقره اصفهان</span></div>
    <div class="loader-track"><div id="loader-bar"></div></div>
    <div id="loader-percent">۰٪</div>
  </div>

  <!-- ۲. هدر ثابت -->
  <header class="site-header">
    <a class="logo" href="#hero" data-scroll-to="#hero"><span class="latin">SilvershopIR</span><span class="logo-sub">نقره ۹۲۵ اصفهان</span></a>
    <nav aria-label="ناوبری اصلی">
      <a href="<?php echo esc_url( home_url( '/products/' ) ); ?>">همه محصولات</a>
      <a href="#story" data-scroll-to="#sec-story">داستان ما</a>
      <a href="#contact" data-scroll-to="#sec-contact">تماس</a>
    </nav>
    <div class="header-side">
      <button type="button" class="music-toggle" id="music-toggle" aria-pressed="false" aria-label="پخش یا قطع موسیقی پس‌زمینه" title="موسیقی">
        <svg class="ic-on" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>
        </svg>
        <svg class="ic-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>
        </svg>
      </button>
      <a class="header-cta" href="https://wa.me/<?php echo esc_attr( SILVERSHOP_WHATSAPP ); ?>" target="_blank" rel="noopener">مشاوره واتساپ</a>
    </div>
  </header>

  <!-- ۳. هیرو -->
  <section class="hero-standalone" id="hero">
    <div class="hero-grid">
      <div class="hero-copy">
        <span class="section-label">انگشتر · نقره ۹۲۵ عیار</span>
        <h1 class="hero-display">
          <span class="latin-display">SILVERSHOP</span>
          <span class="fa-display">نقره‌ی دست‌سازِ اصفهان، درخششی برای همیشه</span>
        </h1>
        <p class="hero-tagline">کمک‌تان می‌کنیم قطعه‌ای را پیدا کنید که سال‌ها همراه‌تان می‌ماند — انگشتر مردانه، انگشتر زنانه و نیم‌ست‌های زنانه.</p>
        <div class="hero-specs">
          <div><span class="spec-k">عیار نقره</span><span class="spec-v">۹۲۵</span></div>
          <div><span class="spec-k">ساخت</span><span class="spec-v">اصفهان</span></div>
          <div><span class="spec-k">شیوه</span><span class="spec-v">دست‌ساز</span></div>
        </div>
        <div class="hero-actions">
          <a class="cta-button" href="#products" data-scroll-to="#sec-product-1">دیدن مجموعه</a>
          <a class="cta-button ghost" href="https://wa.me/<?php echo esc_attr( SILVERSHOP_WHATSAPP ); ?>" target="_blank" rel="noopener">مشاوره واتساپ</a>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <img class="pedestal" src="<?php echo esc_url( get_site_url( null, '/assets/img/pedestal.svg' ) ); ?>" alt="">
        <img class="hero-product" src="<?php echo esc_url( get_site_url( null, '/assets/img/hero-ring.webp' ) ); ?>" alt="">
      </div>
    </div>
    <div class="scroll-indicator" aria-hidden="true">
      <span>اسکرول کنید</span>
      <svg width="16" height="24" viewBox="0 0 16 24" fill="none"><path d="M8 2v16m0 0l-6-6m6 6l6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
  </section>

  <!-- ۴. کنواس (ویدیو / انیمیشن فریم‌به‌فریم) -->
  <div class="canvas-wrap" aria-hidden="true"><canvas id="canvas"></canvas></div>

  <!-- ۵. روکش تیره برای بخش آمار -->
  <div id="dark-overlay" aria-hidden="true"></div>

  <!-- ۶. کانتینر اسکرول -->
  <div id="scroll-container">

    <!-- محصول ۱: انگشتر مردانه -->
    <section class="scroll-section section-content section-product align-right" id="sec-product-1"
             data-enter="6" data-leave="18.8" data-animation="slide-right">
      <div class="section-inner">
        <span class="section-label">۰۰۱ / محصولات</span>
        <figure class="product-figure">
          <img src="<?php echo esc_url( $b1['img'] ); ?>" alt="<?php echo esc_attr( $b1['alt'] ); ?>" loading="lazy">
        </figure>
        <h2 class="section-heading"><?php echo esc_html( $b1['title'] ); ?></h2>
        <p class="section-body"><?php echo esc_html( $b1['body'] ); ?></p>
        <a class="cta-button ghost" href="<?php echo esc_url( $b1['wa'] ); ?>" target="_blank" rel="noopener">استعلام موجودی</a>
      </div>
    </section>

    <!-- محصول ۲: انگشتر زنانه -->
    <section class="scroll-section section-content section-product align-left" id="sec-product-2"
             data-enter="23.1" data-leave="35.9" data-animation="slide-left">
      <div class="section-inner">
        <span class="section-label">۰۰۲ / محصولات</span>
        <figure class="product-figure">
          <img src="<?php echo esc_url( $b2['img'] ); ?>" alt="<?php echo esc_attr( $b2['alt'] ); ?>" loading="lazy">
        </figure>
        <h2 class="section-heading"><?php echo esc_html( $b2['title'] ); ?></h2>
        <p class="section-body"><?php echo esc_html( $b2['body'] ); ?></p>
        <a class="cta-button ghost" href="<?php echo esc_url( $b2['wa'] ); ?>" target="_blank" rel="noopener">استعلام موجودی</a>
      </div>
    </section>

    <!-- محصول ۳: نیم‌ست زنانه -->
    <section class="scroll-section section-content section-product align-right" id="sec-product-3"
             data-enter="40.2" data-leave="53" data-animation="scale-up">
      <div class="section-inner">
        <span class="section-label">۰۰۳ / محصولات</span>
        <figure class="product-figure">
          <img src="<?php echo esc_url( $b3['img'] ); ?>" alt="<?php echo esc_attr( $b3['alt'] ); ?>" loading="lazy">
        </figure>
        <h2 class="section-heading"><?php echo esc_html( $b3['title'] ); ?></h2>
        <p class="section-body"><?php echo esc_html( $b3['body'] ); ?></p>
        <a class="cta-button ghost" href="<?php echo esc_url( $b3['wa'] ); ?>" target="_blank" rel="noopener">استعلام موجودی</a>
      </div>
    </section>

    <!-- آمار (روکش تیره + شمارنده) -->
    <section class="scroll-section section-stats" id="sec-stats"
             data-enter="57.3" data-leave="70.1" data-animation="stagger-up">
      <div class="stats-grid">
        <div class="stat">
          <span class="stat-row"><span class="stat-number" data-value="15" data-decimals="0">۰</span><span class="stat-suffix">+</span></span>
          <span class="stat-label">سال تجربه</span>
        </div>
        <div class="stat">
          <span class="stat-row"><span class="stat-number" data-value="500" data-decimals="0">۰</span><span class="stat-suffix">+</span></span>
          <span class="stat-label">مدل زیورآلات</span>
        </div>
        <div class="stat">
          <span class="stat-row"><span class="stat-number" data-value="1200" data-decimals="0">۰</span><span class="stat-suffix">+</span></span>
          <span class="stat-label">مشتری راضی</span>
        </div>
        <div class="stat">
          <span class="stat-row"><span class="stat-number" data-value="925" data-decimals="0">۰</span></span>
          <span class="stat-label">عیار نقره</span>
        </div>
      </div>
    </section>

    <!-- داستان فروشگاه ما -->
    <section class="scroll-section section-content align-left" id="sec-story"
             data-enter="72.9" data-leave="82.9" data-animation="rotate-in">
      <div class="section-inner">
        <span class="section-label">۰۰۴ / داستان ما</span>
        <h2 class="section-heading">از نقش جهان<br>تا دستان شما</h2>
        <p class="section-body">SilvershopIR از دلِ مجموعه نقش جهان اصفهان آغاز شد؛ با یک باور ساده: نقره‌ی خوب باید هم اصیل باشد، هم در دسترس.</p>
        <p class="section-body">هر انگشتر و نیم‌ستی که عرضه می‌کنیم، از نقره‌ی ۹۲۵ عیار و با وسواس در جزئیات انتخاب یا ساخته می‌شود — همان وسواسی که هنر اصفهان به ما آموخته است.</p>
        <p class="section-body">امروز افتخار ما اعتماد مشتری‌هایی است که برای هدیه‌های مهم زندگی‌شان به ما سر می‌زنند.</p>
      </div>
    </section>

    <!-- فرم مشاوره -->
    <section class="scroll-section section-content align-right" id="sec-form"
             data-enter="83.6" data-leave="94.3" data-animation="clip-reveal">
      <div class="section-inner">
        <span class="section-label">۰۰۵ / مشاوره</span>
        <h2 class="section-heading">مشاوره رایگان</h2>
        <p class="section-body">فرم را پر کنید؛ پیام شما مستقیم در واتساپ فروشگاه باز می‌شود.</p>
        <form id="consult-form" novalidate>
          <div class="form-pair">
            <div class="form-row">
              <label for="f-name">نام و نام خانوادگی</label>
              <input type="text" id="f-name" name="name" autocomplete="name" placeholder="مثلاً: سارا محمدی" required>
            </div>
            <div class="form-row">
              <label for="f-phone">شماره تماس</label>
              <input type="tel" id="f-phone" name="phone" autocomplete="tel" inputmode="tel" placeholder="۰۹۱۲ ...">
            </div>
          </div>
          <div class="form-row">
            <label for="f-topic">موضوع</label>
            <select id="f-topic" name="topic">
              <option value="انگشتر مردانه">انگشتر مردانه</option>
              <option value="انگشتر زنانه">انگشتر زنانه</option>
              <option value="نیم‌ست زنانه">نیم‌ست زنانه</option>
              <option value="سایر">سایر</option>
            </select>
          </div>
          <div class="form-row">
            <label for="f-msg">پیام شما</label>
            <textarea id="f-msg" name="message" rows="2" placeholder="سلام، درباره ... مشاوره می‌خواستم"></textarea>
          </div>
          <button type="submit" class="cta-button">
            ارسال در واتساپ
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.03a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.2-.31a8.1 8.1 0 0 1-1.24-4.28c0-4.47 3.64-8.1 8.16-8.1a8.1 8.1 0 0 1 8.1 8.1c0 4.47-3.63 8.12-8.1 8.12Zm4.44-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.5.11-.11.24-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.16 1.72 2.62 4.16 3.68.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg>
          </button>
        </form>
      </div>
    </section>

    <!-- تماس و آدرس (ماندگار) -->
    <section class="scroll-section section-contact" id="sec-contact"
             data-enter="95" data-leave="100" data-animation="fade-up" data-persist="true">
      <div class="contact-panel">
        <span class="section-label">۰۰۶ / تماس با ما</span>
        <h2 class="section-heading">منتظر شما هستیم</h2>
        <div class="contact-grid">
          <div class="contact-item">
            <span class="contact-key">تلفن</span>
            <a class="contact-value ltr" href="tel:+<?php echo esc_attr( SILVERSHOP_WHATSAPP ); ?>">0992 316 6200</a>
          </div>
          <div class="contact-item">
            <span class="contact-key">واتساپ · پشتیبانی و مشاوره</span>
            <a class="contact-value" href="https://wa.me/<?php echo esc_attr( SILVERSHOP_WHATSAPP ); ?>" target="_blank" rel="noopener">ارسال پیام مستقیم</a>
          </div>
          <div class="contact-item contact-address">
            <span class="contact-key">آدرس</span>
            <address class="contact-value">اصفهان، اتوبان چمران، خیابان آل محمد، مجموعه نقش جهان</address>
          </div>
          <div class="contact-item">
            <span class="contact-key">اینستاگرام</span>
            <a class="contact-value" href="https://instagram.com/silvershopir" target="_blank" rel="noopener">silvershopir@</a>
          </div>
          <div class="contact-item">
            <span class="contact-key">تلگرام</span>
            <a class="contact-value" href="https://t.me/silvershopIR1" target="_blank" rel="noopener">silvershopIR1@</a>
          </div>
          <div class="contact-item">
            <span class="contact-key">ایتا</span>
            <a class="contact-value" href="https://eitaa.com/silvershopIr" target="_blank" rel="noopener">silvershopIr@</a>
          </div>
          <div class="contact-item">
            <span class="contact-key">روبیکا</span>
            <a class="contact-value" href="https://rubika.ir/null" target="_blank" rel="noopener">مشاهده صفحه</a>
          </div>
        </div>
        <footer class="site-footer">
          <span class="latin">© SilvershopIR</span>
          <span>زیورآلات نقره ۹۲۵ — اصفهان</span>
        </footer>
      </div>
    </section>

  </div>

  <?php wp_footer(); ?>
</body>
</html>
