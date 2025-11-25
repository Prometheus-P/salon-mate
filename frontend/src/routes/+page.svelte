<script lang="ts">
	// SalonMate 랜딩 페이지
</script>

<svelte:head>
	<title>SalonMate - AI 기반 뷰티샵 마케팅 자동화</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700">
	<!-- Hero Section -->
	<div class="container mx-auto px-4 py-20">
		<div class="text-center text-white">
			<h1 class="text-5xl font-bold mb-6">SalonMate</h1>
			<p class="text-xl mb-8 opacity-90">
				뷰티샵 사장님을 위한 AI 마케팅 자동화 플랫폼
			</p>
			<p class="text-lg mb-12 opacity-80">
				리뷰 답변과 SNS 콘텐츠 생성을 AI가 자동화합니다.
				<br />
				시술에만 집중하세요.
			</p>

			<div class="flex justify-center gap-4">
				<a
					href="/signup"
					class="btn variant-filled-primary bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
				>
					무료로 시작하기
				</a>
				<a
					href="/login"
					class="btn variant-ghost border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
				>
					로그인
				</a>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="bg-white py-20">
		<div class="container mx-auto px-4">
			<h2 class="text-3xl font-bold text-center text-gray-800 mb-12">핵심 기능</h2>

			<div class="grid md:grid-cols-3 gap-8">
				<!-- 리뷰 자동 답변 -->
				<div class="bg-gray-50 p-6 rounded-xl">
					<div class="text-4xl mb-4">💬</div>
					<h3 class="text-xl font-semibold mb-2">리뷰 자동 답변</h3>
					<p class="text-gray-600">
						구글/네이버 리뷰에 AI가 맞춤형 답변을 자동 생성합니다. 하루 30분 이상 절약하세요.
					</p>
				</div>

				<!-- 인스타그램 콘텐츠 -->
				<div class="bg-gray-50 p-6 rounded-xl">
					<div class="text-4xl mb-4">📸</div>
					<h3 class="text-xl font-semibold mb-2">SNS 콘텐츠 생성</h3>
					<p class="text-gray-600">
						시술 사진만 올리면 캡션과 해시태그를 AI가 생성합니다. 예약 발행도 가능해요.
					</p>
				</div>

				<!-- 마케팅 대시보드 -->
				<div class="bg-gray-50 p-6 rounded-xl">
					<div class="text-4xl mb-4">📊</div>
					<h3 class="text-xl font-semibold mb-2">마케팅 인사이트</h3>
					<p class="text-gray-600">
						리뷰 현황, 포스팅 성과를 한눈에 확인하세요. 데이터 기반으로 마케팅 전략을 세워보세요.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-gray-900 py-16">
		<div class="container mx-auto px-4 text-center">
			<h2 class="text-2xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
			<p class="text-gray-400 mb-8">14일 무료 체험, 신용카드 없이 시작 가능</p>
			<a
				href="/signup"
				class="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
			>
				무료로 시작하기
			</a>
		</div>
	</div>

	<!-- Footer -->
	<footer class="bg-gray-800 py-8">
		<div class="container mx-auto px-4 text-center text-gray-400">
			<p>&copy; 2025 SalonMate. All rights reserved.</p>
		</div>
	</footer>
</div>
