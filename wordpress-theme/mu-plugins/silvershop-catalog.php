<?php
/**
 * SilvershopIR — کاتالوگ محصولات (بدون نیاز به ووکامرس)
 * نوع‌نوشته‌ی «محصول» + دسته‌بندی + قیمت/موجودی + دکمه سفارش در واتساپ.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// شماره واتساپ فروشگاه — برای تغییر، همین مقدار را ویرایش کنید.
define( 'SILVERSHOP_WHATSAPP', '989923166200' );

/** ثبت نوع‌نوشته‌ی «محصول» */
add_action( 'init', function () {
	register_post_type( 'ss_product', array(
		'labels' => array(
			'name'               => 'محصولات',
			'singular_name'      => 'محصول',
			'add_new'            => 'افزودن محصول',
			'add_new_item'       => 'افزودن محصول جدید',
			'edit_item'          => 'ویرایش محصول',
			'new_item'           => 'محصول جدید',
			'view_item'          => 'مشاهده محصول',
			'search_items'       => 'جست‌وجوی محصول',
			'not_found'          => 'محصولی یافت نشد',
			'not_found_in_trash' => 'محصولی در زباله‌دان نیست',
			'all_items'          => 'همه محصولات',
			'menu_name'          => 'محصولات',
			'featured_image'     => 'عکس اصلی محصول',
			'set_featured_image' => 'انتخاب عکس محصول',
		),
		'public'       => true,
		'show_in_menu' => true,
		'menu_icon'    => 'dashicons-media-code',
		'menu_position'=> 5,
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'has_archive'  => 'products',
		'rewrite'      => array( 'slug' => 'products' ),
		'show_in_rest' => true,
	) );

	register_taxonomy( 'ss_product_cat', 'ss_product', array(
		'labels' => array(
			'name'          => 'دسته‌بندی محصول',
			'singular_name' => 'دسته',
			'search_items'  => 'جست‌وجوی دسته',
			'all_items'     => 'همه دسته‌ها',
			'edit_item'     => 'ویرایش دسته',
			'add_new_item'  => 'افزودن دسته جدید',
			'menu_name'     => 'دسته‌بندی‌ها',
		),
		'hierarchical' => true,
		'public'       => true,
		'show_in_rest' => true,
		'rewrite'      => array( 'slug' => 'product-category' ),
	) );
} );

/** باکس قیمت و موجودی در صفحه‌ی ویرایش محصول */
add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'ss_product_details',
		'قیمت و موجودی',
		function ( $post ) {
			wp_nonce_field( 'ss_product_save', 'ss_product_nonce' );
			$price = get_post_meta( $post->ID, '_ss_price', true );
			$avail = get_post_meta( $post->ID, '_ss_availability', true );
			if ( ! $avail ) $avail = 'available';
			?>
			<p>
				<label for="ss_price"><strong>قیمت (تومان)</strong></label><br>
				<input type="text" id="ss_price" name="ss_price" value="<?php echo esc_attr( $price ); ?>"
					style="width:100%" placeholder="مثلاً: 4500000 — یا خالی بگذارید برای «تماس بگیرید»">
			</p>
			<p>
				<label for="ss_availability"><strong>وضعیت موجودی</strong></label><br>
				<select id="ss_availability" name="ss_availability" style="width:100%">
					<option value="available" <?php selected( $avail, 'available' ); ?>>موجود</option>
					<option value="call" <?php selected( $avail, 'call' ); ?>>تماس بگیرید</option>
					<option value="out" <?php selected( $avail, 'out' ); ?>>ناموجود</option>
				</select>
			</p>
			<?php
		},
		'ss_product',
		'side',
		'high'
	);
} );

add_action( 'save_post_ss_product', function ( $post_id ) {
	if ( ! isset( $_POST['ss_product_nonce'] ) || ! wp_verify_nonce( $_POST['ss_product_nonce'], 'ss_product_save' ) ) return;
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( isset( $_POST['ss_price'] ) ) {
		update_post_meta( $post_id, '_ss_price', sanitize_text_field( $_POST['ss_price'] ) );
	}
	if ( isset( $_POST['ss_availability'] ) ) {
		update_post_meta( $post_id, '_ss_availability', sanitize_text_field( $_POST['ss_availability'] ) );
	}
} );

/** ستون قیمت/موجودی در لیست محصولات ادمین */
add_filter( 'manage_ss_product_posts_columns', function ( $cols ) {
	$new = array();
	foreach ( $cols as $k => $v ) {
		$new[ $k ] = $v;
		if ( $k === 'title' ) {
			$new['ss_price']  = 'قیمت';
			$new['ss_avail']  = 'موجودی';
		}
	}
	return $new;
} );
add_action( 'manage_ss_product_posts_custom_column', function ( $col, $post_id ) {
	if ( $col === 'ss_price' ) {
		$p = get_post_meta( $post_id, '_ss_price', true );
		echo $p ? esc_html( number_format_i18n( (float) $p ) ) . ' تومان' : '—';
	}
	if ( $col === 'ss_avail' ) {
		$map = array( 'available' => 'موجود', 'call' => 'تماس بگیرید', 'out' => 'ناموجود' );
		$a = get_post_meta( $post_id, '_ss_availability', true ) ?: 'available';
		echo esc_html( $map[ $a ] ?? $a );
	}
}, 10, 2 );

/** کمکی: ساخت لینک واتساپ با پیام آماده برای یک محصول */
function silvershop_whatsapp_link( $product_title ) {
	$text = "سلام، درباره‌ی محصول «{$product_title}» می‌خواستم استعلام قیمت/موجودی بگیرم.";
	return 'https://wa.me/' . SILVERSHOP_WHATSAPP . '?text=' . rawurlencode( $text );
}
