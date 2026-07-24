<?php
if ( ! defined( 'ABSPATH' ) ) exit;
$current_term = get_queried_object();
$current_slug = ( $current_term instanceof WP_Term ) ? $current_term->slug : '';
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl" <?php language_attributes(); ?>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>محصولات — SilvershopIR</title>
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?> style="background:var(--bg);">

  <header class="shop-header">
    <a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>"><span class="latin">SilvershopIR</span><span class="logo-sub">نقره ۹۲۵ اصفهان</span></a>
    <a class="back" href="<?php echo esc_url( home_url( '/' ) ); ?>">بازگشت به صفحه اصلی ←</a>
  </header>

  <main class="shop-wrap">
    <h1 class="shop-title">همه‌ی محصولات</h1>
    <p class="shop-sub">برای استعلام قیمت و موجودی روی هر محصول بزنید.</p>

    <?php $cats = get_terms( array( 'taxonomy' => 'ss_product_cat', 'hide_empty' => false ) ); ?>
    <?php if ( ! empty( $cats ) && ! is_wp_error( $cats ) ) : ?>
      <nav class="cat-filter">
        <a href="<?php echo esc_url( get_post_type_archive_link( 'ss_product' ) ); ?>" class="<?php echo $current_slug === '' ? 'is-active' : ''; ?>">همه</a>
        <?php foreach ( $cats as $cat ) : ?>
          <a href="<?php echo esc_url( get_term_link( $cat ) ); ?>" class="<?php echo $current_slug === $cat->slug ? 'is-active' : ''; ?>"><?php echo esc_html( $cat->name ); ?></a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>

    <?php if ( have_posts() ) : ?>
      <div class="product-grid">
        <?php while ( have_posts() ) : the_post(); ?>
          <a class="product-card" href="<?php the_permalink(); ?>">
            <div class="thumb">
              <?php if ( has_post_thumbnail() ) the_post_thumbnail( 'medium' ); ?>
            </div>
            <div class="body">
              <?php
              $terms = get_the_terms( get_the_ID(), 'ss_product_cat' );
              if ( $terms && ! is_wp_error( $terms ) ) {
                  echo '<span class="cat">' . esc_html( $terms[0]->name ) . '</span>';
              }
              ?>
              <h3><?php the_title(); ?></h3>
              <div class="row"><?php echo silvershop_price_html( get_the_ID() ); ?></div>
            </div>
          </a>
        <?php endwhile; ?>
      </div>
    <?php else : ?>
      <p class="shop-sub">هنوز محصولی ثبت نشده — از پنل مدیریت، «محصولات ← افزودن محصول» را بزنید.</p>
    <?php endif; ?>
  </main>

  <?php wp_footer(); ?>
</body>
</html>
