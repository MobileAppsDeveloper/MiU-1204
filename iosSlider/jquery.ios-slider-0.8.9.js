/*
 * iosSlider - http://iosscripts.com/iosslider-jquery-horizontal-slider-for-iphone-ipad-safari/
 * 
 * A jQuery Horizontal Slider for iPhone/iPad Safari (Beta) 
 * This plugin turns any wide element into a touch enabled horizontal slider.
 * 
 * Copyright (c) 2011 - 2012 Marc Whitbread
 * 
 * Version: v0.8.9 beta (04/02/2012)
 * Requires: jQuery v1.3+
 *
 * My Rules:
 *
 * 1) You may use iosSlider freely, without restriction in any material intended for sale 
 *    or distribution. Attribution is not required but always appreciated.
 * 2) You are not permitted to make the resources found on iosscripts.com available for 
 *    distribution elsewhere "as is" without prior consent. If you would like to feature 
 *    iosSlider on your site, please do not link directly to the resource zip files. Please 
 *    link to the appropriate page on iosscripts.com where users can find the download.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

;(function($) {
	
	/* global variables */
	var scrollbarNumber = 0;
	var sliderMin = 0;
	var xScrollDistance = 0;
	var yScrollDistance = 0;
	var scrollIntervalTime = 10;
	var scrollbarDistance = 0;
	var isTouch = 'ontouchstart' in window;
	var isWebkit = false;
	var isIe7 = false;
	var isIe8 = false;
	var isIe9 = false;
	var isIe = false;
	var isGecko = false;
	var grabOutCursor = 'pointer';
	var grabInCursor = 'pointer';
	var onChangeEventLastFired = new Array();
	var autoSlideTimeouts = new Array();
	var iosSliders = new Array();
	var iosSliderSettings = new Array();
	var isEventCleared = new Array();
	setBrowserInfo();
	
	/* scrollbar funcs */
	function showScrollbar(settings, scrollbarClass) {
		
		if(settings.scrollbarHide) {
			$('.' + scrollbarClass).css({
				opacity: settings.scrollbarOpacity,
				filter: 'alpha(opacity:' + (settings.scrollbarOpacity * 100) + ')'
			});
		}
		
	}
	
	function hideScrollbar(settings, scrollTimeouts, j, distanceOffsetArray, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder) {
		
		if(settings.scrollbar && settings.scrollbarHide) {
			
			for(var i = j; i < j+25; i++) {
				
				scrollTimeouts[scrollTimeouts.length] = hideScrollbarIntervalTimer(scrollIntervalTime * i, distanceOffsetArray[j], ((j + 24) - i) / 24, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, settings);
				
			}
		
		}
		
	}

	function hideScrollbarInterval(newOffset, opacity, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, settings) {
		
		scrollbarDistance = (newOffset * -1) / (sliderMax) * (stageWidth - scrollMargin - scrollBorder - scrollbarWidth);
		
		setSliderOffset('.' + scrollbarClass, scrollbarDistance);
		
		$('.' + scrollbarClass).css({
			opacity: settings.scrollbarOpacity * opacity,
			filter: 'alpha(opacity:' + (settings.scrollbarOpacity * opacity * 100) + ')'
		});
		
	}
	
	/* slider funcs */
	function slowScrollHorizontalInterval(node, newOffset, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, activeChildOffset, childrenOffsets, infiniteSliderWidth, infiniteSliderOffset, numberOfSlides, settings) {

		newChildOffset = calcActiveOffset(settings, newOffset, 0, childrenOffsets, sliderMax, stageWidth, undefined);
		if(newChildOffset != activeChildOffset) {
			settings.onSlideChange(settings, node, $(node).children(':eq(' + activeChildOffset + ')'), activeChildOffset%infiniteSliderOffset);	
		}
					
		newOffset = Math.floor(newOffset);
					
		setSliderOffset(node, newOffset);
		
		if(settings.scrollbar) {
			
			scrollbarDistance = Math.floor((newOffset * -1) / (sliderMax) * (stageWidth - scrollMargin - scrollbarWidth));
			var width = scrollbarWidth - scrollBorder;
			
			if(newOffset >= sliderMin) {
				
				width = scrollbarWidth - scrollBorder - (scrollbarDistance * -1);
				
				setSliderOffset($('.' + scrollbarClass), 0);
				
				$('.' + scrollbarClass).css({
					width: width + 'px'
				});
			
			} else if(newOffset <= ((sliderMax * -1) + 1)) {
				
				width = stageWidth - scrollMargin - scrollBorder - scrollbarDistance;
				
				setSliderOffset($('.' + scrollbarClass), scrollbarDistance);
				
				$('.' + scrollbarClass).css({
					width: width + 'px'
				});
				
			} else {
				
				setSliderOffset($('.' + scrollbarClass), scrollbarDistance);
				
				$('.' + scrollbarClass).css({
					width: width + 'px'
				});
			
			}
			
		}
		
	}
	
	function slowScrollHorizontal(node, scrollTimeouts, sliderMax, scrollbarClass, xScrollDistance, yScrollDistance, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, activeChildOffset, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings) {

		var distanceOffsetArray = new Array();
		var nodeOffset = getSliderOffset(node, 'x');
		var snapDirection = 0;
		var maxSlideVelocity = 25 / 1024 * stageWidth;
		var changeSlideFired = false;
		frictionCoefficient = settings.frictionCoefficient;
		elasticFrictionCoefficient = settings.elasticFrictionCoefficient;
		snapFrictionCoefficient = settings.snapFrictionCoefficient;
		snapToChildren = settings.snapToChildren;
			
		if((xScrollDistance > 5) && snapToChildren) {
			snapDirection = 1;
		} else if((xScrollDistance < -5) && snapToChildren) {
			snapDirection = -1;
		}
		
		if(xScrollDistance < (maxSlideVelocity * -1)) {
			xScrollDistance = maxSlideVelocity * -1;
		} else if(xScrollDistance > maxSlideVelocity) {
			xScrollDistance = maxSlideVelocity;
		}
		
		var testNodeOffsets = getAnimationSteps(settings, xScrollDistance, nodeOffset, sliderMax, sliderMin, childrenOffsets);

		var newChildOffset = snapToChildren ?
			calcActiveOffset(settings, nodeOffset, snapDirection, childrenOffsets, sliderMax, stageWidth, activeChildOffset) :
			calcActiveOffset(settings, testNodeOffsets[testNodeOffsets.length-1], snapDirection, childrenOffsets, sliderMax, stageWidth, activeChildOffset);
		
		if(settings.infiniteSlider) {

			if(childrenOffsets[newChildOffset] > (childrenOffsets[numberOfSlides + 1] + stageWidth)) {
				newChildOffset = newChildOffset + numberOfSlides;
			}
			
			if(childrenOffsets[newChildOffset] < (childrenOffsets[(numberOfSlides * 2 - 1)] - stageWidth)) {
				newChildOffset = newChildOffset - numberOfSlides;
			}
			
		}
		
		if(((testNodeOffsets[testNodeOffsets.length-1] < childrenOffsets[newChildOffset]) && (snapDirection < 0)) || ((testNodeOffsets[testNodeOffsets.length-1] > childrenOffsets[newChildOffset]) && (snapDirection > 0)) || (!snapToChildren)) {
			
			while((xScrollDistance > 1) || (xScrollDistance < -1)) {
		
				xScrollDistance = xScrollDistance * frictionCoefficient;
				nodeOffset = nodeOffset + xScrollDistance;
				
				if((nodeOffset > sliderMin) || (nodeOffset < (sliderMax * -1))) {
					xScrollDistance = xScrollDistance * elasticFrictionCoefficient;
					nodeOffset = nodeOffset + xScrollDistance;
				}
				
				distanceOffsetArray[distanceOffsetArray.length] = nodeOffset;
		
			}
			
		}
		
		if(snapToChildren || (nodeOffset > sliderMin) || (nodeOffset < (sliderMax * -1))) {

			while((nodeOffset < (childrenOffsets[newChildOffset] - 0.5)) || (nodeOffset > (childrenOffsets[newChildOffset] + 0.5))) {
				
				nodeOffset = ((nodeOffset - (childrenOffsets[newChildOffset])) * snapFrictionCoefficient) + (childrenOffsets[newChildOffset]);
				distanceOffsetArray[distanceOffsetArray.length] = nodeOffset;
				
			}
			
			distanceOffsetArray[distanceOffsetArray.length] = childrenOffsets[newChildOffset];

		}
		
		var jStart = 1;
		if((distanceOffsetArray.length%2) != 0) {
			jStart = 0;
		}
		
		var lastTimeoutRegistered = 0;
		var count = 0;

		for(var j = jStart; j < distanceOffsetArray.length; j = j + 2) {
		
			scrollTimeouts[scrollTimeouts.length] = slowScrollHorizontalIntervalTimer(scrollIntervalTime * j, node, distanceOffsetArray[j], sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, newChildOffset, childrenOffsets, infiniteSliderWidth, infiniteSliderOffset, numberOfSlides, settings);
			
		}
		
		scrollTimeouts[scrollTimeouts.length] = onSlideCompleteTimer(scrollIntervalTime * (j + 1), settings, node, $(node).children(':eq(' + newChildOffset + ')'), newChildOffset%infiniteSliderOffset, sliderNumber);

		hideScrollbar(settings, scrollTimeouts, j, distanceOffsetArray, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder);
		
		return newChildOffset;
			
	}
	
	/* global funcs */
	function onSlideComplete(settings, node, slideNode, newChildOffset, sliderNumber) {
		
		if(onChangeEventLastFired[sliderNumber] != newChildOffset) {
		
			settings.onSlideComplete(settings, node, slideNode, newChildOffset);
		
		}
		
		onChangeEventLastFired[sliderNumber] = newChildOffset;
	
	}
	
	function getSliderOffset(node, xy) {
		
		var sliderOffset = 0;
		if(xy == 'x') {
			xy = 4;
		} else {
			xy = 5;
		}
		
		if(isTouch || isWebkit) {
		
			var webkitTransformArray = $(node).css('-webkit-transform').split(',');
			sliderOffset = parseInt(webkitTransformArray[xy], 10);
			
		} else {
		
			sliderOffset = parseInt($(node).css('left'), 10);
		
		}
		
		return sliderOffset;
	
	}
	
	function setSliderOffset(node, sliderOffset) {
		
		if(isTouch || isWebkit) {
		
			$(node).css({
				webkitTransform: 'translateX(' + sliderOffset + 'px)'
			});
		
		} else {
		
			$(node).css({
				left: sliderOffset + 'px'
			});
		
		}
					
	}
	
	function setBrowserInfo() {
		
		if(navigator.userAgent.match('WebKit') != null) {
			isWebkit = true;
			grabOutCursor = '-webkit-grab';
			grabInCursor = '-webkit-grabbing';
		} else if(navigator.userAgent.match('Gecko') != null) {
			isGecko = true;
			grabOutCursor = 'move';
			grabInCursor = '-moz-grabbing';
		} else if(navigator.userAgent.match('MSIE 7') != null) {
			isIe7 = true;
			isIe = true;
		} else if(navigator.userAgent.match('MSIE 8') != null) {
			isIe8 = true;
			isIe = true;
		} else if(navigator.userAgent.match('MSIE 9') != null) {
			isIe9 = true;
			isIe = true;
		}
		
	}
	
	function getAnimationSteps(settings, xScrollDistance, nodeOffset, sliderMax, sliderMin, childrenOffsets) {
		
		var offsets = new Array();
		
		if((xScrollDistance <= 1) && (xScrollDistance >= 0)) {
		
			xScrollDistance = -2;
		
		} else if((xScrollDistance >= -1) && (xScrollDistance <= 0)) {
		
			xScrollDistance = 2;
		
		}
		
		while((xScrollDistance > 1) || (xScrollDistance < -1)) {
			
			xScrollDistance = xScrollDistance * settings.frictionCoefficient;
			nodeOffset = nodeOffset + xScrollDistance;
			
			if((nodeOffset > sliderMin) || (nodeOffset < (sliderMax * -1))) {
				xScrollDistance = xScrollDistance * settings.elasticFrictionCoefficient;
				nodeOffset = nodeOffset + xScrollDistance;
			}
			
			offsets[offsets.length] = nodeOffset;
	
		}
		
		activeChildOffset = 0;
		
		return offsets;
		
	}
	
	function calcActiveOffset(settings, offset, snapDirection, childrenOffsets, sliderMax, stageWidth, activeChildOffset) {
		
		var isFirst = false;
		var arrayOfOffsets = new Array();
		var newChildOffset;
		
		for(var i = 0; i < childrenOffsets.length; i++) {
			
			if((childrenOffsets[i] <= offset) && (childrenOffsets[i] > (offset - stageWidth))) {
				
				if(!isFirst && (childrenOffsets[i] != offset)) {
					
					arrayOfOffsets[arrayOfOffsets.length] = childrenOffsets[i-1];
					
				}
				
				arrayOfOffsets[arrayOfOffsets.length] = childrenOffsets[i];
				
				isFirst = true;
					
			}
		
		}
		
		if(arrayOfOffsets.length == 0) {
			arrayOfOffsets[0] = childrenOffsets[childrenOffsets.length - 1];
		}
		
		var distance = stageWidth;
		var closestChildOffset = 0;
		
		for(var i = 0; i < arrayOfOffsets.length; i++) {
			
			var newDistance = Math.abs(offset - arrayOfOffsets[i]);
			
			if(newDistance < distance) {
				closestChildOffset = arrayOfOffsets[i];
				distance = newDistance;
			}
			
		}
		
		for(var i = 0; i < childrenOffsets.length; i++) {
			
			if(closestChildOffset == childrenOffsets[i]) {
				
				newChildOffset = i;
				
			}
			
		}
		
		if(snapDirection < 0) {
			
			newChildOffset = activeChildOffset + 1;
		
			if(newChildOffset >= childrenOffsets.length) newChildOffset = childrenOffsets.length - 1;
			
		} else if(snapDirection > 0) {
			
			newChildOffset = activeChildOffset - 1;
			
			if(newChildOffset < 0) newChildOffset = 0;
			
		}
		
		return newChildOffset;
	
	}
	
	function changeSlide(slide, node, scrollTimeouts, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, childrenOffsets, scrollbarNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings) {
		
		for(var j = 0; j < scrollTimeouts.length; j++) {
			clearTimeout(scrollTimeouts[j]);
		}
		
		var steps = settings.autoSlideSpeed / 10;
		var startOffset = getSliderOffset(node, 'x');
		var endOffset = childrenOffsets[slide];
		var offsetDiff = endOffset - startOffset;
		var stepArray = new Array();
		var t;
		var nextStep;
		
		showScrollbar(settings, scrollbarClass);
		
		for(var i = 0; i <= steps; i++) {
			
			//easeOutQuint
			t = i;
			t /= steps;
			t--;
			nextStep = startOffset + offsetDiff*(Math.pow(t,5) + 1);
			
			if(settings.infiniteSlider) {
			
				if(nextStep > (childrenOffsets[numberOfSlides + 1] + stageWidth)) {
					nextStep = nextStep - infiniteSliderWidth;
					slide = numberOfSlides * 2 - 1;
				}
				
				if(nextStep < (childrenOffsets[numberOfSlides * 2 - 1] - stageWidth)) {
					nextStep = nextStep + infiniteSliderWidth;
					slide = numberOfSlides + 1;
				}
			
			}
			
			stepArray[stepArray.length] = nextStep;
			
		}
		
		for(var i = 0; i < stepArray.length; i++) {
			
			scrollTimeouts[i] = slowScrollHorizontalIntervalTimer(scrollIntervalTime * (i + 1), node, stepArray[i], sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, slide, childrenOffsets, infiniteSliderWidth, infiniteSliderOffset, numberOfSlides, settings);
			
		}
					
		if(offsetDiff != 0) {
			scrollTimeouts[scrollTimeouts.length] = onSlideCompleteTimer(scrollIntervalTime * (i + 1), settings, node, $(node).children(':eq(' + slide + ')'), slide%infiniteSliderOffset, scrollbarNumber);
		}
		
		hideScrollbar(settings, scrollTimeouts, i, stepArray, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder);
		
		return slide;
		
	}
	
	function slowScrollHorizontalIntervalTimer(scrollIntervalTime, node, step, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, slide, childrenOffsets, infiniteSliderWidth, infiniteSliderOffset, numberOfSlides, settings) {
	
		var scrollTimeout = setTimeout(function() {
			slowScrollHorizontalInterval(node, step, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, slide, childrenOffsets, infiniteSliderWidth, infiniteSliderOffset, numberOfSlides, settings);
		}, scrollIntervalTime);
		
		return scrollTimeout;
	
	}
	
	function onSlideCompleteTimer(scrollIntervalTime, settings, node, slideNode, slide, scrollbarNumber) {
		
		var scrollTimeout = setTimeout(function() {
			onSlideComplete(settings, node, slideNode, slide, scrollbarNumber);
		}, scrollIntervalTime);
		
		return scrollTimeout;
	
	}
	
	function hideScrollbarIntervalTimer(scrollIntervalTime, newOffset, opacity, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, settings) {
	
		var scrollTimeout = setTimeout(function() {
			hideScrollbarInterval(newOffset, opacity, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, settings);
		}, scrollIntervalTime);
	
		return scrollTimeout;
	
	}
	
	/* public functions */	
	$.fn.iosSlider = function(options) {
		
		var settings = jQuery.extend({}, jQuery.fn.iosSlider.defaults, options);

	    return $(this).each(function(i) {
			
			scrollbarNumber++;
			var sliderNumber = scrollbarNumber;
			iosSliderSettings[sliderNumber] = settings;
			var scrollTimeouts = new Array();
			var sliderMax;
			var minTouchpoints = 0;
			var xCurrentScrollRate = new Array(0, 0);
			var yCurrentScrollRate = new Array(0, 0);
			var scrollbarBlockClass = 'scrollbarBlock' + scrollbarNumber;
			var scrollbarClass = 'scrollbar' + scrollbarNumber;
			var scrollbarWidth;
			var windowWidth;
			var stageNode = $(this);
			var stageWidth;
			var slideWidth;
			var scrollMargin;
			var scrollBorder;
			var lastTouch;
			var activeChildOffset = settings.startAtSlide-1;
			var newChildOffset = -1;
			var webkitTransformArray = new Array();
			var childrenOffsets;
			var scrollbarStartOpacity = 0;
			var xScrollStartPosition = 0;
			var yScrollStartPosition = 0;
			var currentTouches = 0;
			var scrollerNode = $(this).children(':first-child');
			var slideNodes;
			var numberOfSlides = $(scrollerNode).children().size();
			var xScrollStarted = false;
			var lastChildOffset = 0;
			var isMouseDown = false;
			var currentSlider = undefined;
			var sliderStopLocation = 0;
			var infiniteSliderWidth;
			var infiniteSliderOffset = numberOfSlides;
			onChangeEventLastFired[sliderNumber] = -1;
			var isAutoSlideToggleOn = false;
			iosSliders[sliderNumber] = stageNode;
			isEventCleared[sliderNumber] = false;
			
			if(settings.infiniteSlider) {
	
				settings.scrollbar = false;
				$(scrollerNode).children().clone().prependTo(scrollerNode).clone().appendTo(scrollerNode);
				infiniteSliderOffset = numberOfSlides;
				
			}
			
			slideNodes = $(scrollerNode).children();
					
			if(settings.scrollbar) {
			
				$(scrollerNode).parent().append("<div class = '" + scrollbarBlockClass + "'><div class = '" + scrollbarClass + "'></div></div>");
			
			}
			
			if(!init()) return true;
			
			if(settings.infiniteSlider) {
				
				activeChildOffset = activeChildOffset + infiniteSliderOffset;
				setSliderOffset(scrollerNode, childrenOffsets[activeChildOffset]);
				
			}
					
			settings.onSliderLoaded(settings, scrollerNode, $(scrollerNode).children(':eq(' + activeChildOffset + ')'), activeChildOffset%infiniteSliderOffset);
			
			function init() {
				
				if(settings.autoSlide) {
					clearTimeout(autoSlideTimeouts[sliderNumber]);
				}
				
				$(stageNode).css('width', '');
				$(slideNodes).css('width', '');
				
				sliderMax = 0;
				childrenOffsets = new Array();
				windowWidth = $(window).width();
				stageWidth = $(stageNode).width();
				
				if(settings.responsiveSlideWidth) {
					stageWidth = ($(stageNode).width() > windowWidth) ? windowWidth : $(stageNode).width();
				}
				
				$(stageNode).css({
					position: 'relative',
					top: '0',
					left: '0',
					overflow: 'hidden',
					zIndex: 1,
					width: stageWidth
				});
				
				if(settings.responsiveSlideWidth) {
					
					slideWidth = $(slideNodes).outerWidth(true);
					
					if(slideWidth > windowWidth) {
						
						slideWidth = windowWidth + ($(slideNodes).outerWidth(true) - $(slideNodes).width()) * -1;
					
					} else {
						
						slideWidth = $(slideNodes).width();
						
					}
					
					$(slideNodes).css({
						width: slideWidth
					});
				
				}

				$(scrollerNode).children().each(function(j) {
					
					$(this).css({
						float: 'left'
					});
					
					childrenOffsets[j] = sliderMax * -1;
					
					sliderMax = sliderMax + $(this).outerWidth(true);
					
				});
				
				for(var i = 0; i < childrenOffsets.length; i++) {
					
					if(childrenOffsets[i] <= ((sliderMax - stageWidth) * -1)) {
						break;
					}
					
					lastChildOffset = i;
					
				}
				
				childrenOffsets.splice(lastChildOffset + 1, childrenOffsets.length);
	
				childrenOffsets[childrenOffsets.length] = (sliderMax - stageWidth) * -1;
				
				sliderMax = sliderMax - stageWidth;
				
				$(scrollerNode).css({
					'webkitPerspective': 1000,
					'webkitBackfaceVisibility': 'hidden',
					position: 'relative',
					cursor: grabOutCursor,
					width: sliderMax + stageWidth + 'px',
					overflow: 'hidden'
				});
				
				setSliderOffset(scrollerNode, childrenOffsets[activeChildOffset]);
				
				if(sliderMax <= 0) {
					
					$(scrollerNode).css({
						cursor: 'default'
					});
					
					return false;
				}
				
				if(!isTouch && !settings.desktopClickDrag) {
					
					$(scrollerNode).css({
						cursor: 'default'
					});
					
				}
				
				if(settings.scrollbar) {
					
					$('.' + scrollbarBlockClass).css({ 
						margin: settings.scrollbarMargin,
						overflow: 'hidden',
						display: 'none'
					});
					
					$('.' + scrollbarBlockClass + ' .' + scrollbarClass).css({ 
						border: settings.scrollbarBorder
					});
					
					scrollMargin = parseInt($('.' + scrollbarBlockClass).css('marginLeft')) + parseInt($('.' + scrollbarBlockClass).css('marginRight'));
					scrollBorder = parseInt($('.' + scrollbarBlockClass + ' .' + scrollbarClass).css('borderLeftWidth'), 10) + parseInt($('.' + scrollbarBlockClass + ' .' + scrollbarClass).css('borderRightWidth'), 10);
					scrollbarWidth = Math.floor((stageWidth) / (sliderMax + stageWidth) * (stageWidth - scrollMargin));
	
					if(!settings.scrollbarHide) {
						scrollbarStartOpacity = settings.scrollbarOpacity;
					}
					
					$('.' + scrollbarBlockClass).css({ 
						position: 'absolute',
						left: 0,
						width: stageWidth - scrollMargin + 'px',
						margin: settings.scrollbarMargin
					});
					
					if(settings.scrollbarLocation == 'top') {
						$('.' + scrollbarBlockClass).css('top', '0');
					} else {
						$('.' + scrollbarBlockClass).css('bottom', '0');
					}
					
					$('.' + scrollbarBlockClass + ' .' + scrollbarClass).css({ 
						borderRadius: settings.scrollbarBorderRadius,
						background: settings.scrollbarBackground,
						height: settings.scrollbarHeight,
						width: scrollbarWidth - scrollBorder + 'px',
						minWidth: settings.scrollbarHeight,
						border: settings.scrollbarBorder,
						'webkitPerspective': 1000,
						'webkitBackfaceVisibility': 'hidden',
						'webkitTransform': 'translateX(' + Math.floor((childrenOffsets[activeChildOffset] * -1) / (sliderMax) * (stageWidth - scrollMargin - scrollbarWidth)) + 'px)',
						opacity: scrollbarStartOpacity,
						filter: 'alpha(opacity:' + (scrollbarStartOpacity * 100) + ')',
						boxShadow: settings.scrollbarShadow
					});
	
					$('.' + scrollbarBlockClass).css({
						display: 'block'
					});
					
					if(!isTouch) {	
						$('.' + scrollbarClass).css({
							position: 'relative',
							left: Math.floor((childrenOffsets[activeChildOffset] * -1) / (sliderMax) * (stageWidth - scrollMargin - scrollbarWidth))
						});
					}
					
				}
				
				if(settings.navSlideSelector != '') {
							
					$(settings.navSlideSelector).each(function(j) {
						
						$(this).css({
							cursor: 'pointer'
						});
						
						$(this).unbind('click').bind('click', function() {
							
							var goToSlide = j;
							if(settings.infiniteSlider) {
								goToSlide = j + infiniteSliderOffset;
							}
							
							activeChildOffset = changeSlide(goToSlide, scrollerNode, scrollTimeouts, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
						});
					
					});
							
				}	
				
				if(settings.navPrevSelector != '') {
					
					$(settings.navPrevSelector).css({
						cursor: 'pointer'
					});
					
					$(settings.navPrevSelector).unbind('click').bind('click', function() {	
						if((activeChildOffset > 0) || settings.infiniteSlider) {
							activeChildOffset = changeSlide(activeChildOffset - 1, scrollerNode, scrollTimeouts, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
						} 
					});
				
				}
				
				if(settings.navNextSelector != '') {
					
					$(settings.navNextSelector).css({
						cursor: 'pointer'
					});
					
					$(settings.navNextSelector).unbind('click').bind('click', function() {
						if((activeChildOffset < childrenOffsets.length-1) || settings.infiniteSlider) {
							activeChildOffset = changeSlide(activeChildOffset + 1, scrollerNode, scrollTimeouts, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
						}
					});
				
				}
				
				if(settings.autoSlide) {
					
					if(settings.autoSlideToggleSelector != '') {
					
						$(settings.autoSlideToggleSelector).css({
							cursor: 'pointer'
						});
						
						$(settings.autoSlideToggleSelector).unbind('click').bind('click', function() {
							
							if(!isAutoSlideToggleOn) {
							
								clearTimeout(autoSlideTimeouts[sliderNumber]);
								isAutoSlideToggleOn = true;
								
								$(settings.autoSlideToggleSelector).addClass('on');
								
							} else {
							
								autoSlideTimeouts[sliderNumber] = setTimeout(autoSlide, settings.autoSlideTimer + settings.autoSlideSpeed);
								isAutoSlideToggleOn = false;
								
								$(settings.autoSlideToggleSelector).removeClass('on');
								
							}
						
						});
					
					}
					
					function autoSlide() {

						activeChildOffset = calcActiveOffset(settings, getSliderOffset(scrollerNode, 'x'), 0, childrenOffsets, sliderMax, stageWidth, undefined) + 1;
						
						if(!settings.infiniteSlider && (activeChildOffset > childrenOffsets.length-1)) {
							activeChildOffset = activeChildOffset - numberOfSlides;
						}
						
						activeChildOffset = changeSlide(activeChildOffset, scrollerNode, scrollTimeouts, sliderMax, scrollbarClass, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
						
						autoSlideTimeouts[sliderNumber] = setTimeout(autoSlide, settings.autoSlideTimer + settings.autoSlideSpeed);
						
					}
					
					if(!isAutoSlideToggleOn) {
						clearTimeout(autoSlideTimeouts[sliderNumber]);
						autoSlideTimeouts[sliderNumber] = setTimeout(autoSlide, settings.autoSlideTimer + settings.autoSlideSpeed);
					}

					if(!isTouch) {
					
						$(stageNode).hover(function() {
							clearTimeout(autoSlideTimeouts[sliderNumber]);
						}, function() {
							if(!isAutoSlideToggleOn) {
								clearTimeout(autoSlideTimeouts[sliderNumber]);
								autoSlideTimeouts[sliderNumber] = setTimeout(autoSlide, settings.autoSlideTimer + settings.autoSlideSpeed);
							}
							
						});
					
					} else {
						
						$(stageNode).bind('touchend', function() {
						
							if(!isAutoSlideToggleOn) {
								clearTimeout(autoSlideTimeouts[sliderNumber]);
								autoSlideTimeouts[sliderNumber] = setTimeout(autoSlide, settings.autoSlideTimer + settings.autoSlideSpeed);
							}
						
						});
					
					}
				
				}
				
				if(settings.infiniteSlider) {
				
					infiniteSliderWidth = (sliderMax + stageWidth) / 3;
					
				}
			
				onSlideComplete(settings, scrollerNode, $(scrollerNode).children(':eq(' + activeChildOffset + ')'), activeChildOffset%infiniteSliderOffset, sliderNumber);
				
				return true;
			
			}
			
			if(isTouch && iosSliderSettings[sliderNumber].responsiveSlideWidth) {
				
				$(window).bind('orientationchange', function() {
						
					if(!init()) return true;
					
				});
				
			} else if(iosSliderSettings[sliderNumber].responsiveSlideWidth) {
			
				$(window).bind('resize', function(e) {

					if(!init()) return true;
				
				});
			
			}
			
			if(isTouch || settings.desktopClickDrag) {
				
				$(scrollerNode).bind('touchstart mousedown', function(e) {
					
					clearTimeout(autoSlideTimeouts[sliderNumber]);
					
					if(!isTouch) {
						
						if (window.getSelection) {
							if (window.getSelection().empty) {
								window.getSelection().empty();
							} else if (window.getSelection().removeAllRanges) {
								window.getSelection().removeAllRanges();
							}
						} else if (document.selection) {
							document.selection.empty();
						}
						
					}

					if(isTouch) {
						eventX = event.touches[0].pageX;
						eventY = event.touches[0].pageY;
					} else {
						eventX = e.pageX;
						eventY = e.pageY;
						isMouseDown = true;
						currentSlider = this;
						
						$(scrollerNode).css({
							cursor: grabInCursor
						});
					}
					
					xCurrentScrollRate = new Array(0, 0);
					yCurrentScrollRate = new Array(0, 0);
					xScrollDistance = 0;
					xScrollStarted = false;
					
					for(var j = 0; j < scrollTimeouts.length; j++) {
						clearTimeout(scrollTimeouts[j]);
					}
					
					var scrollPosition = getSliderOffset(this, 'x');
					
					activeChildOffset = calcActiveOffset(settings, scrollPosition, 0, childrenOffsets, sliderMax, stageWidth, undefined);
					
					if(settings.infiniteSlider) {
						
						if(activeChildOffset%numberOfSlides == 0) {
							$(this).children(':nth-child(' + numberOfSlides + 'n+1)').html($(this).children(':eq(' + activeChildOffset + ')').html());
						}
						
					}
					
					if(scrollPosition > sliderMin) {
					
						scrollPosition = sliderMin;
						
						setSliderOffset(this, scrollPosition);
						
						$('.' + scrollbarClass).css({
							width: (scrollbarWidth - scrollBorder) + 'px'
						});
						
					} else if(scrollPosition < (sliderMax * -1)) {
					
						scrollPosition = sliderMax * -1;
						
						setSliderOffset(this, scrollPosition);
						
						setSliderOffset($('.' + scrollbarClass), (stageWidth - scrollMargin - scrollbarWidth));
						
						$('.' + scrollbarClass).css({
							width: (scrollbarWidth - scrollBorder) + 'px'
						});
						
					} 
					
					xScrollStartPosition = (getSliderOffset(this, 'x') - eventX) * -1;
					yScrollStartPosition = (getSliderOffset(this, 'y') - eventY) * -1;
					
					xCurrentScrollRate[1] = eventX;
					yCurrentScrollRate[1] = eventY;
					
				});
				
				$(scrollerNode).bind('touchmove mousemove', function(e) {
					
					if(!isTouch) {
						
						if (window.getSelection) {
							if (window.getSelection().empty) {
								window.getSelection().empty();
							} else if (window.getSelection().removeAllRanges) {
								window.getSelection().removeAllRanges();
							}
						} else if (document.selection) {
							document.selection.empty();
						}
						
					}
					
					if(isTouch) {
						eventX = event.touches[0].pageX;
						eventY = event.touches[0].pageY;
					} else {
						eventX = e.pageX;
						eventY = e.pageY;
						
						if(!isMouseDown) {
							return false;
						}
					}
					
					if(settings.infiniteSlider) {

						if(getSliderOffset(this, 'x') > (childrenOffsets[numberOfSlides + 1] + stageWidth)) {
							xScrollStartPosition = xScrollStartPosition + infiniteSliderWidth;
						}
						
						if(getSliderOffset(this, 'x') < (childrenOffsets[numberOfSlides * 2 - 1] - stageWidth)) {
							xScrollStartPosition = xScrollStartPosition - infiniteSliderWidth;
						}
						
					}
					
					xCurrentScrollRate[0] = xCurrentScrollRate[1];
					xCurrentScrollRate[1] = eventX;
					xScrollDistance = (xCurrentScrollRate[1] - xCurrentScrollRate[0]) / 2;
					
					yCurrentScrollRate[0] = yCurrentScrollRate[1];
					yCurrentScrollRate[1] = eventY;
					yScrollDistance = (yCurrentScrollRate[1] - yCurrentScrollRate[0]) / 2;
					
					if(((xScrollDistance > 5) || (xScrollDistance < -5)) && (isTouch)) {
					
						event.preventDefault();
						xScrollStarted = true;
						
					} else if(!isTouch) {
					
						xScrollStarted = true;
						
					}
					
					if(xScrollStarted) {

						var scrollPosition = getSliderOffset(this, 'x');
						
						if(isTouch) {
							if(currentTouches != event.touches.length) {
								xScrollStartPosition = (scrollPosition * -1) + eventX;	
							}
							
							currentTouches = event.touches.length;
						}
								
						var edgeDegradation = 0;
						elasticPullResistance = settings.elasticPullResistance;
						
						if(scrollPosition > sliderMin) {
						
							edgeDegradation = (xScrollStartPosition - eventX) * elasticPullResistance;
							
						}
						
						if(scrollPosition < (sliderMax * -1)) {
							
							edgeDegradation = (sliderMax + ((xScrollStartPosition - eventX) * -1)) * elasticPullResistance * -1;
										
						}
						
						setSliderOffset(this, (xScrollStartPosition - eventX - edgeDegradation) * -1);
						
						if(settings.scrollbar) {
							
							showScrollbar(settings, scrollbarClass);
		
							scrollbarDistance = Math.floor((xScrollStartPosition - eventX - edgeDegradation) / (sliderMax) * (stageWidth - scrollMargin - scrollbarWidth));
							var width = scrollbarWidth;
							
							if(scrollPosition >= sliderMin) {
								
								width = scrollbarWidth - scrollBorder - (scrollbarDistance * -1);
								
								setSliderOffset($('.' + scrollbarClass), 0);
								
								$('.' + scrollbarClass).css({
									width: width + 'px'
								});
								
							} else if(scrollPosition <= ((sliderMax * -1) + 1)) {
								
								width = stageWidth - scrollMargin - scrollBorder - scrollbarDistance;
								
								setSliderOffset($('.' + scrollbarClass), scrollbarDistance);
								
								$('.' + scrollbarClass).css({
									width: width + 'px'
								});	
								
							} else {
								
								setSliderOffset($('.' + scrollbarClass), scrollbarDistance);
								
							}
							
						}
						
						if(isTouch) {
							lastTouch = event.touches[0].pageX;
						}
					
					}
					
					newChildOffset = calcActiveOffset(settings, (xScrollStartPosition - eventX - edgeDegradation) * -1, 0, childrenOffsets, sliderMax, stageWidth, undefined);
					if(newChildOffset != activeChildOffset) {
						settings.onSlideChange(settings, this, $(this).children(':eq(' + newChildOffset + ')'), newChildOffset%infiniteSliderOffset);	
					}
					
				});
				
				$(scrollerNode).bind('touchend', function() {

					if(event.touches.length != 0) {
						
						for(var j = 0; j < sizeof(event.touches.length); j++) {
							
							if(event.touches[j].pageX == lastTouch) {
								activeChildOffset = slowScrollHorizontal(this, scrollTimeouts, sliderMax, scrollbarClass, xScrollDistance, yScrollDistance, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, activeChildOffset, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
							}
							
						}
						
					} else {
					
						activeChildOffset = slowScrollHorizontal(this, scrollTimeouts, sliderMax, scrollbarClass, xScrollDistance, yScrollDistance, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, activeChildOffset, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
						
					}
					
				});
				
				if(!isTouch) {
					
					var eventObject = $(window);

					if(isIe8 || isIe7) {
						var eventObject = $(document); 
					}
					
					$(eventObject).bind('mouseup', function(e) {
						
						if(!isEventCleared[sliderNumber]) {
						
							$(scrollerNode).css({
								cursor: grabOutCursor
							});
							
							isMouseDown = false;
							
							if((currentSlider == undefined) || (xCurrentScrollRate[0] == 0)) {
								return false;
							}
							
							activeChildOffset = slowScrollHorizontal(currentSlider, scrollTimeouts, sliderMax, scrollbarClass, xScrollDistance, yScrollDistance, scrollbarWidth, stageWidth, scrollMargin, scrollBorder, activeChildOffset, childrenOffsets, sliderNumber, infiniteSliderOffset, infiniteSliderWidth, numberOfSlides, settings);
							
							currentSlider = undefined;
						
						}
						
					});
					
				} 
			
			}
			
		});
		
		return this;
	
    };
    
    $.iosSlider = function() {}
    
    $.iosSlider.destroy = function(clearStyle) {
    	
    	if(clearStyle == undefined) {
    		clearStyle = true;
    	}
    	
    	for(var i = 0; i < autoSlideTimeouts.length; i++) {
    		clearTimeout(autoSlideTimeouts[i]);
    	}
    	
    	for(var i = 1; i < iosSliders.length; i++) {
    		isEventCleared[i] = true;
    		
    		$(iosSliders[i]).unbind();
    		$(iosSliders[i]).children(':first-child').unbind();
    		$(iosSliders[i]).children(':first-child').children().unbind();
    		
    		$(iosSliderSettings[i].navSlideSelector).unbind();
    		$(iosSliderSettings[i].navPrevSelector).unbind();
    		$(iosSliderSettings[i].navNextSelector).unbind();
    		$(iosSliderSettings[i].autoSlideToggleSelector).unbind();
    		
    		iosSliderSettings[i].responsiveSlideWidth = false;
    		
    		if(clearStyle) {
    			$(iosSliders[i]).attr('style', '');
	    		$(iosSliders[i]).children(':first-child').attr('style', '');
	    		$(iosSliders[i]).children(':first-child').children().attr('style', '');
	    		
	    		$(iosSliderSettings[i].navSlideSelector).attr('style', '');
	    		$(iosSliderSettings[i].navPrevSelector).attr('style', '');
	    		$(iosSliderSettings[i].navNextSelector).attr('style', '');
	    		$(iosSliderSettings[i].autoSlideToggleSelector).attr('style', '');
    		}
    		
    		if(iosSliderSettings[i].infiniteSlider) {
    			var numSlides = $(iosSliders[i]).children(':first-child').children().size();
    			numSlides = numSlides / 3;
    			$(iosSliders[i]).children(':first-child').html();
    			$(iosSliders[i]).children(':first-child').html($(iosSliders[i]).children(':first-child').children(':nth-child(-n+' + numSlides + ')').clone());
    		}
    		
    	}
    	
    }
    
    jQuery.fn.iosSlider.defaults = {
    	'elasticPullResistance': 0.6, 		
		'frictionCoefficient': 0.92,
		'elasticFrictionCoefficient': 0.6,
		'snapFrictionCoefficient': 0.92,
		'snapToChildren': false,
		'startAtSlide': 1,
		'scrollbar': false,
		'scrollbarHide': true,
		'scrollbarLocation': 'top',
		'scrollbarOpacity': 0.4,
		'scrollbarHeight': '4px',
		'scrollbarBorder': '0',
		'scrollbarMargin': '5px',
		'scrollbarBackground': '#000',
		'scrollbarBorderRadius': '100px',
		'scrollbarShadow': '0 0 0 #000',
		'desktopClickDrag': false,
		'responsiveSlideWidth': true,
		'navSlideSelector': '',
		'navPrevSelector': '',
		'navNextSelector': '',
		'autoSlideToggleSelector': '',
		'autoSlide': false,
		'autoSlideTimer': 5000,
		'autoSlideSpeed': 750,
		'infiniteSlider': false,
		'onSliderLoaded': function() {},
		'onSlideChange': function() {},
		'onSlideComplete': function() {}
	};

}) (jQuery);