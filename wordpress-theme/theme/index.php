<?php
/** الگوی پیش‌فرضِ الزامیِ وردپرس — در عمل front-page.php / archive-ss_product.php / single-ss_product.php استفاده می‌شوند. */
if ( ! defined( 'ABSPATH' ) ) exit;
?><!DOCTYPE html>
<html lang="fa" dir="rtl" <?php language_attributes(); ?>>
<head><meta charset="UTF-8"><?php wp_head(); ?></head>
<body <?php body_class(); ?>>
<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
	<article>
		<h1><?php the_title(); ?></h1>
		<?php the_content(); ?>
	</article>
<?php endwhile; endif; wp_footer(); ?>
</body>
</html>
