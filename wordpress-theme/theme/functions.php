<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_theme_support( 'title-tag' );
add_theme_support( 'post-thumbnails' );

/** بارگذاری استایل/اسکریپت‌ها */
add_action( 'wp_enqueue_scripts', function () {

	// فونت‌ها و توکن‌های طراحی (همان فایل سایتِ اصلی، بدون تغییر)
	// لایه‌ی توکن‌ها باید پیش از استایل اصلی بیاید — همه‌ی مقادیر از آن خوانده می‌شود
	wp_enqueue_style( 'silvershop-tokens', get_site_url( null, '/css/tokens.css' ), array(), '1.1.0' );
	wp_enqueue_style( 'silvershop-main', get_site_url( null, '/css/style.css' ), array( 'silvershop-tokens' ), '1.1.0' );

	if ( is_front_page() ) {
		// موتور اسکرول سینمایی فقط در صفحه‌ی اصلی لازم است
		wp_enqueue_script( 'lenis', get_site_url( null, '/js/vendor/lenis.min.js' ), array(), '1.0.0', true );
		wp_enqueue_script( 'gsap', get_site_url( null, '/js/vendor/gsap.min.js' ), array(), '1.0.0', true );
		wp_enqueue_script( 'scrolltrigger', get_site_url( null, '/js/vendor/ScrollTrigger.min.js' ), array( 'gsap' ), '1.0.0', true );
		wp_enqueue_script( 'silvershop-app', get_site_url( null, '/js/app.js' ), array( 'lenis', 'gsap', 'scrolltrigger' ), '1.0.0', true );
	} else {
		wp_enqueue_style( 'silvershop-shop', get_template_directory_uri() . '/shop.css', array( 'silvershop-main' ), '1.0.0' );
	}
} );

/** خروجیِ نام قیمت خوانا برای محصول */
function silvershop_price_html( $post_id ) {
	$avail = get_post_meta( $post_id, '_ss_availability', true ) ?: 'available';
	if ( $avail === 'out' ) return '<span class="ss-badge ss-out">ناموجود</span>';
	if ( $avail === 'call' ) return '<span class="ss-badge ss-call">تماس بگیرید</span>';
	$price = get_post_meta( $post_id, '_ss_price', true );
	if ( ! $price ) return '<span class="ss-badge ss-call">تماس بگیرید</span>';
	return '<span class="ss-price">' . esc_html( number_format_i18n( (float) $price ) ) . ' <small>تومان</small></span>';
}

/** آخرین محصولِ یک دسته را برمی‌گرداند (برای بخش‌های سه‌گانه‌ی صفحه‌ی اصلی) */
function silvershop_get_category_product( $cat_slug ) {
	$q = new WP_Query( array(
		'post_type'      => 'ss_product',
		'posts_per_page' => 1,
		'orderby'        => 'date',
		'order'          => 'DESC',
		'tax_query'      => array( array(
			'taxonomy' => 'ss_product_cat',
			'field'    => 'slug',
			'terms'    => $cat_slug,
		) ),
	) );
	return $q->have_posts() ? $q->posts[0] : null;
}
