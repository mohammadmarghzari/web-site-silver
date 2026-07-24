<?php
if ( ! defined( 'ABSPATH' ) ) exit;
while ( have_posts() ) : the_post();
$terms = get_the_terms( get_the_ID(), 'ss_product_cat' );
$cat_name = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->name : '';
$wa = silvershop_whatsapp_link( get_the_title() );
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl" <?php language_attributes(); ?>>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php the_title(); ?> — SilvershopIR</title>
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?> style="background:var(--bg);">

  <header class="shop-header">
    <a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>"><span class="latin">SilvershopIR</span><span class="logo-sub">نقره ۹۲۵ اصفهان</span></a>
    <a class="back" href="<?php echo esc_url( get_post_type_archive_link( 'ss_product' ) ); ?>">→ بازگشت به محصولات</a>
  </header>

  <main class="shop-wrap">
    <div class="single-product">
      <div class="photo">
        <?php if ( has_post_thumbnail() ) the_post_thumbnail( 'large' ); ?>
      </div>
      <div class="info">
        <?php if ( $cat_name ) : ?><span class="cat"><?php echo esc_html( $cat_name ); ?></span><?php endif; ?>
        <h1><?php the_title(); ?></h1>
        <div class="desc"><?php the_content(); ?></div>
        <div class="price-row"><?php echo silvershop_price_html( get_the_ID() ); ?></div>
        <a class="wa-btn" href="<?php echo esc_url( $wa ); ?>" target="_blank" rel="noopener">
          استعلام قیمت و موجودی در واتساپ
        </a>
      </div>
    </div>
  </main>

  <?php wp_footer(); ?>
</body>
</html>
<?php endwhile; ?>
