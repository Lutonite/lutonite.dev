(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---- hero boot sequence ---- */
	function bootHero() {
		var cmdEl = document.getElementById('hero-cmd');
		var caretEl = document.getElementById('hero-caret');
		var outputEl = document.getElementById('hero-output');
		if (!cmdEl || !outputEl) return;

		var text = 'whoami';

		function reveal() {
			caretEl.classList.remove('caret');
			caretEl.classList.add('caret-static');
			outputEl.classList.add('show');
		}

		if (reduceMotion) {
			cmdEl.textContent = text;
			reveal();
			return;
		}

		var i = 0;
		(function typeChar() {
			if (i <= text.length) {
				cmdEl.textContent = text.slice(0, i);
				i += 1;
				setTimeout(typeChar, 80);
			} else {
				setTimeout(reveal, 350);
			}
		})();
	}

	/* ---- scroll reveal for sections ---- */
	function initScrollReveal() {
		var blocks = document.querySelectorAll('.block');
		if (!blocks.length) return;

		if (reduceMotion || typeof IntersectionObserver === 'undefined') {
			blocks.forEach(function (b) { b.classList.add('in-view'); });
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('in-view');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
		);

		blocks.forEach(function (b) { observer.observe(b); });
	}

	/* ---- copy to clipboard ---- */
	function initCopyButtons() {
		var toast = document.getElementById('toast');
		var toastTimer = null;

		function showToast(message) {
			if (!toast) return;
			toast.textContent = message;
			toast.classList.add('show');
			clearTimeout(toastTimer);
			toastTimer = setTimeout(function () {
				toast.classList.remove('show');
			}, 1600);
		}

		document.querySelectorAll('[data-copy]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var value = btn.getAttribute('data-copy');
				var done = function () { showToast('# copied ' + value + ' to clipboard'); };
				var fail = function () { showToast('# copy failed — select manually'); };

				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(value).then(done, fail);
				} else {
					fail();
				}
			});
		});
	}

	/* ---- smooth scroll for chrome nav ---- */
	function initNavScroll() {
		document.querySelectorAll('.chrome-nav a').forEach(function (link) {
			link.addEventListener('click', function (e) {
				var id = link.getAttribute('href');
				var target = document.querySelector(id);
				if (!target) return;
				e.preventDefault();
				target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
			});
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		bootHero();
		initScrollReveal();
		initCopyButtons();
		initNavScroll();
	});
})();
