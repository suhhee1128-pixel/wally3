import React, { useState, useRef, useEffect } from 'react';

function SplashScreen() {

  const [imageLoaded, setImageLoaded] = useState(false);

  const [eyePositions, setEyePositions] = useState({ left: null, right: null, size: null });

  const [isBlinking, setIsBlinking] = useState(false);

  const imageRef = useRef(null);

  const containerRef = useRef(null);

  useEffect(() => {

    if (imageLoaded && imageRef.current && containerRef.current) {

      const img = imageRef.current;

      const container = containerRef.current;

      

      // 이미지의 실제 렌더링 크기 가져오기

      const imgRect = img.getBoundingClientRect();

      

      // 이미지 크기 대비 눈 위치 계산

      const imgWidth = imgRect.width;

      const imgHeight = imgRect.height;

      

      // 눈 크기: 이미지 너비의 약 22%

      const eyeSize = imgWidth * 0.25;

      

      // 눈 위치: 상단 중앙 (이미지 설명 기준)

      const eyeTop = imgHeight * 0.31; // 상단 31% 위치

      const eyeCenterX = imgWidth * 0.66; // 약간 오른쪽

      const eyeGap = imgWidth * 0.05; // 눈 사이 간격 (5% - 거의 붙어있음)

      const eyeLeft = eyeCenterX - eyeGap; // 왼쪽 눈 중심

      const eyeRight = eyeCenterX + eyeGap; // 오른쪽 눈 중심

      

      const leftX = eyeLeft - eyeSize / 2;

      const rightX = eyeRight - eyeSize / 2;

      const topY = eyeTop - eyeSize / 2;

      

      console.log('Eye positions:', {

        imgWidth,

        imgHeight,

        eyeSize,

        eyeTop,

        eyeLeft,

        eyeRight,

        leftX,

        rightX,

        topY,

        calculatedLeft: `${leftX}px`,

        calculatedRight: `${rightX}px`,

        calculatedTop: `${topY}px`

      });

      

      setEyePositions({

        left: { x: eyeLeft, y: eyeTop },

        right: { x: eyeRight, y: eyeTop },

        size: eyeSize

      });

      

      console.log('Eye positions set:', {

        size: eyeSize,

        left: { x: eyeLeft, y: eyeTop },

        right: { x: eyeRight, y: eyeTop }

      });

    }

  }, [imageLoaded]);

  // 깜빡임 애니메이션: 처음 1.5초는 눈 뜨고 있다가, 그 다음 깜빡깜빡 2번 (빠르게)

  useEffect(() => {

    if (!imageLoaded || !eyePositions.size) return;

    // 처음 1.5초 대기

    const initialDelay = setTimeout(() => {

      // 첫 번째 깜빡임

      setIsBlinking(true);

      setTimeout(() => {

        setIsBlinking(false);

        // 두 번째 깜빡임 (0.2초 후)

        setTimeout(() => {

          setIsBlinking(true);

          setTimeout(() => {

            setIsBlinking(false);

          }, 200); // 깜빡임 지속 시간

        }, 200); // 깜빡임 사이 간격

      }, 200); // 깜빡임 지속 시간

    }, 1500); // 처음 1.5초 대기

    return () => clearTimeout(initialDelay);

  }, [imageLoaded, eyePositions.size]);

  return (

    <>

      <style>{`
        /* 모바일 전체 화면 스플래시 */
        @media (max-width: 768px), (hover: none) and (pointer: coarse) {
          .splash-container .phone-frame {
            width: 100% !important;
            height: 100vh !important;
            height: 100dvh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .splash-container .phone-content {
            width: 100% !important;
            height: 100% !important;
            min-height: 100vh !important;
            min-height: 100dvh !important;
          }

          .splash-container img {
            max-width: 95vw !important;
            max-height: 95vh !important;
            width: auto !important;
            height: auto !important;
          }
        }

        body.mobile-device .splash-container .phone-frame,
        html.mobile-device .splash-container .phone-frame {
          width: 100% !important;
          height: 100vh !important;
          height: 100dvh !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        body.mobile-device .splash-container .phone-content,
        html.mobile-device .splash-container .phone-content {
          width: 100% !important;
          height: 100% !important;
          min-height: 100vh !important;
          min-height: 100dvh !important;
        }

        body.mobile-device .splash-container img,
        html.mobile-device .splash-container img {
          max-width: 95vw !important;
          max-height: 95vh !important;
          width: auto !important;
          height: auto !important;
        }
      `}</style>

      <div className="app-container splash-container" style={{ zIndex: 9999 }}>

        <div className="phone-frame" style={{ background: '#9DFF00', overflow: 'hidden' }}>

          <div 

            className="phone-content flex items-center justify-center"

            style={{ 

              backgroundColor: '#9DFF00',

              position: 'relative',

              overflow: 'hidden'

            }}

          >

            <div 

              ref={containerRef}

              className="relative inline-block"

              style={{ position: 'relative', display: 'inline-block' }}

            >

                <img 

                  ref={imageRef}

                  src="/splash.png" 

                  alt="Wally" 

                  className="w-auto h-auto max-w-[80vw] max-h-[80vh] md:max-w-[80vw] md:max-h-[80vh] object-contain"

                  style={{ display: 'block', position: 'relative', zIndex: 5 }}

                  onLoad={() => setImageLoaded(true)}

                />

            {/* 눈 깜빡임 효과 */}

            {(() => {

              console.log('Render check:', {

                imageLoaded,

                eyePositions,

                hasSize: !!eyePositions.size,

                hasLeft: !!eyePositions.left,

                hasRight: !!eyePositions.right

              });

              

              if (imageLoaded && eyePositions.size && eyePositions.left && eyePositions.right) {

                return (

                  <>

                    {/* 왼쪽 눈 - 위쪽 오버레이 */}

                    <div 

                      className="absolute pointer-events-none"

                      style={{

                        width: `${eyePositions.size}px`,

                        height: `${eyePositions.size / 2}px`,

                        left: `${eyePositions.left.x - eyePositions.size / 2}px`,

                        top: `${eyePositions.left.y - eyePositions.size / 2}px`,

                        transformOrigin: 'top',

                        transform: `scaleY(${isBlinking ? 1 : 0})`,

                        zIndex: 20,

                        backgroundColor: '#9DFF00',

                        borderTopLeftRadius: '50%',

                        borderTopRightRadius: '50%',

                        transition: 'transform 0.2s ease-in-out',

                        pointerEvents: 'none',

                      }}

                    />

                    {/* 왼쪽 눈 - 아래쪽 오버레이 */}

                    <div 

                      className="absolute pointer-events-none"

                      style={{

                        width: `${eyePositions.size}px`,

                        height: `${eyePositions.size / 2}px`,

                        left: `${eyePositions.left.x - eyePositions.size / 2}px`,

                        top: `${eyePositions.left.y}px`,

                        transformOrigin: 'bottom',

                        transform: `scaleY(${isBlinking ? 1 : 0})`,

                        zIndex: 20,

                        backgroundColor: '#9DFF00',

                        borderBottomLeftRadius: '50%',

                        borderBottomRightRadius: '50%',

                        transition: 'transform 0.2s ease-in-out',

                        pointerEvents: 'none',

                      }}

                    />

                    {/* 오른쪽 눈 - 위쪽 오버레이 */}

                    <div 

                      className="absolute pointer-events-none"

                      style={{

                        width: `${eyePositions.size}px`,

                        height: `${eyePositions.size / 2}px`,

                        left: `${eyePositions.right.x - eyePositions.size / 2}px`,

                        top: `${eyePositions.right.y - eyePositions.size / 2}px`,

                        transformOrigin: 'top',

                        transform: `scaleY(${isBlinking ? 1 : 0})`,

                        zIndex: 20,

                        backgroundColor: '#9DFF00',

                        borderTopLeftRadius: '50%',

                        borderTopRightRadius: '50%',

                        transition: 'transform 0.2s ease-in-out',

                        pointerEvents: 'none',

                      }}

                    />

                    {/* 오른쪽 눈 - 아래쪽 오버레이 */}

                    <div 

                      className="absolute pointer-events-none"

                      style={{

                        width: `${eyePositions.size}px`,

                        height: `${eyePositions.size / 2}px`,

                        left: `${eyePositions.right.x - eyePositions.size / 2}px`,

                        top: `${eyePositions.right.y}px`,

                        transformOrigin: 'bottom',

                        transform: `scaleY(${isBlinking ? 1 : 0})`,

                        zIndex: 20,

                        backgroundColor: '#9DFF00',

                        borderBottomLeftRadius: '50%',

                        borderBottomRightRadius: '50%',

                        transition: 'transform 0.2s ease-in-out',

                        pointerEvents: 'none',

                      }}

                    />

                  </>

                );

              }

              return null;

            })()}

            </div>

          </div>

        </div>

      </div>

    </>

  );

}

export default SplashScreen;

