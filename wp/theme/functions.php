<?php
/**
 * Cobrinha block theme — enqueue the site styles and script, register the pattern category.
 */
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'cobrinha-fonts', 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Poppins:wght@400;500;600;700&display=swap', array(), null );
	wp_enqueue_style( 'cobrinha-site', get_template_directory_uri() . '/assets/css/site.css', array(), '1.0.0' );
	wp_enqueue_script( 'cobrinha-site', get_template_directory_uri() . '/assets/js/site.js', array(), '1.0.0', array( 'in_footer' => true, 'strategy' => 'defer' ) );
} );
add_action( 'init', function () {
	register_block_pattern_category( 'cobrinha', array( 'label' => 'Cobrinha' ) );
} );
add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/site.css' );
} );
// Site-wide meta the static prototype carried in the <head>.
add_action( 'wp_head', function () {
	echo '<meta name="theme-color" content="#0B0B0C">' . "\n";
	echo '<link rel="icon" href="' . esc_url( get_template_directory_uri() ) . '/assets/img/favicon.svg" type="image/svg+xml">' . "\n";
	echo '<script type="application/ld+json">{"@context":"https://schema.org","@type":"SportsActivityLocation","name":"Alliance Jiu Jitsu Los Angeles by Cobrinha","alternateName":"Cobrinha Brazilian Jiu-Jitsu & Fitness","telephone":"+1-323-931-9953","email":"info@cobrinhabjj.com","url":"https://www.cobrinhabjj.com/","address":{"@type":"PostalAddress","streetAddress":"4929 Wilshire Blvd #104","addressLocality":"Los Angeles","addressRegion":"CA","postalCode":"90010","addressCountry":"US"}}</script>' . "\n";
}, 5 );
// Live schedule from Gymdesk: /wp-json/cobrinha/v1/schedule (cached one hour; falls back to the bundled copy).
function cobrinha_schedule_events() {
	$cached = get_transient( 'cobrinha_schedule' );
	if ( is_array( $cached ) ) { return $cached; }
	$events = array();
	$res = wp_remote_get( 'https://cobrinha-jiu-jitsu-academy.gymdesk.com/schedule', array( 'timeout' => 20, 'user-agent' => 'Mozilla/5.0 (cobrinhabjj.com schedule sync)' ) );
	if ( ! is_wp_error( $res ) && 200 === wp_remote_retrieve_response_code( $res ) ) {
		preg_match_all( '/data-event-info="([^"]+)"/', wp_remote_retrieve_body( $res ), $m );
		$seen = array();
		foreach ( $m[1] as $raw ) {
			$e = json_decode( html_entity_decode( $raw, ENT_QUOTES | ENT_HTML5 ), true );
			if ( ! is_array( $e ) || empty( $e['title'] ) || ( isset( $e['website_visible'] ) && ! $e['website_visible'] ) ) { continue; }
			if ( false !== stripos( $e['title'], 'free trial' ) ) { continue; } // adults have no free trial; the public feed is stale
			list( $hh, $mm ) = explode( ':', $e['start'] );
			$start = intval( $hh ) * 60 + intval( $mm );
			$key   = $e['day'] . '|' . $start . '|' . $e['title'];
			if ( isset( $seen[ $key ] ) ) { continue; }
			$seen[ $key ] = 1;
			$events[] = array( 'day' => intval( $e['day'] ), 'start' => $start, 'end' => $start + intval( $e['duration'] ?: 60 ), 'title' => trim( $e['title'] ), 'color' => isset( $e['color'] ) ? $e['color'] : '', 'id' => isset( $e['id'] ) ? $e['id'] : null );
		}
		if ( count( $events ) ) { // the public feed omits Sunday (day 0 = Sunday, as JS getDay)
			$events[] = array( 'day' => 0, 'start' => 600, 'end' => 675, 'title' => 'All Levels BJJ (members only)', 'color' => 'black', 'id' => null );
		}
		usort( $events, function ( $a, $b ) { return ( $a['day'] * 10000 + $a['start'] ) - ( $b['day'] * 10000 + $b['start'] ); } );
	}
	if ( count( $events ) < 10 ) { // Gymdesk unreachable or changed its markup: serve the copy shipped with the theme
		$json   = @file_get_contents( get_template_directory() . '/assets/js/schedule.json' );
		$data   = $json ? json_decode( $json, true ) : null;
		$events = ( $data && ! empty( $data['events'] ) ) ? $data['events'] : $events;
		set_transient( 'cobrinha_schedule', $events, 10 * MINUTE_IN_SECONDS );
	} else {
		set_transient( 'cobrinha_schedule', $events, HOUR_IN_SECONDS );
	}
	return $events;
}
add_action( 'rest_api_init', function () {
	register_rest_route( 'cobrinha/v1', '/schedule', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function () {
		return array( 'source' => 'https://cobrinha-jiu-jitsu-academy.gymdesk.com/schedule', 'events' => cobrinha_schedule_events() );
	} ) );
} );
add_action( 'wp_head', function () {
	echo '<script>window.SCHEDULE_URL=' . wp_json_encode( esc_url_raw( rest_url( 'cobrinha/v1/schedule' ) ) ) . ';</script>' . "\n";
}, 6 );
// Pages the theme expects to exist. Created once on activation with the matching template.
add_action( 'init', function () {
	if ( get_option( 'cobrinha_pages_created' ) ) { return; }
	$pages = array( 'start' => 'Start here', 'kids' => 'Kids & teens', 'programs' => 'Programs', 'schedule' => 'Schedule', 'academy' => 'The academy', 'instructors' => 'Instructors', 'accomplishments' => 'Competition record', 'visit' => 'Visiting & parking', 'pricing' => 'Membership', 'faq' => 'Questions & answers', 'contact' => 'Contact', 'free-class' => 'Book a kids\' free trial class', 'privacy' => 'Privacy policy' );
	foreach ( $pages as $slug => $title ) {
		if ( ! get_page_by_path( $slug ) ) {
			$id = wp_insert_post( array( 'post_title' => $title, 'post_name' => $slug, 'post_type' => 'page', 'post_status' => 'publish', 'post_content' => '' ) );
			if ( $id ) { update_post_meta( $id, '_wp_page_template', 'page-' . $slug ); }
		}
	}
	if ( ! get_page_by_path( 'home' ) ) {
		$home = wp_insert_post( array( 'post_title' => 'Home', 'post_name' => 'home', 'post_type' => 'page', 'post_status' => 'publish', 'post_content' => '' ) );
		update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $home );
	}
	update_option( 'cobrinha_pages_created', 1 );
} );
