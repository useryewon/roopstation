const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let recorder, audioChunks = [], loops = [];
let visualizerCount = 0;

        // 클릭 사운드 추가
const clickSound = new Audio('click-sound.mp3'); // 클릭 사운드 파일 경로

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        clickSound.currentTime = 0;  // 사운드가 중첩되지 않도록
        clickSound.play();  // 사운드 재생
    });
});

        // 마이크 접근 허용
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const input = audioContext.createMediaStreamSource(stream);
                recorder = new MediaRecorder(stream);

                recorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };

                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks);
                    const audioURL = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioURL);
                    audio.loop = true; // 녹음된 오디오를 반복 재생 설정
                    loops.push(audio);
                    audioChunks = [];   // 다음 녹음을 위해 배열 초기화

                    createVisualizer(audio);
                };
            });

        // 녹음 버튼 클릭 시 녹음 시작
        document.getElementById('record').addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            recorder.start();
        });

        // 녹음 중단
        document.getElementById('stop').addEventListener('click', () => {
            recorder.stop();
        });

        // 루프 재생
        document.getElementById('play').addEventListener('click', () => {
            loops.forEach(loop => {
                loop.currentTime = 0; // 이전 재생 상태 초기화
                loop.play();
            });
        });

        // 마지막 레이어 삭제
        document.getElementById('deleteLast').addEventListener('click', () => {
            const lastLoop = loops.pop();
            if (lastLoop) {
                lastLoop.pause();
                lastLoop.currentTime = 0;
            }
        });

        // 모든 레이어 삭제
        document.getElementById('deleteAll').addEventListener('click', () => {
            loops.forEach(loop => {
                loop.pause();
                loop.currentTime = 0;
            });
            loops = [];
        });

        // 비주얼라이저 생성 함수
        function createVisualizer(audio) {
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            // 새로운 비주얼라이저 생성
            const visualizer = document.createElement('div');
            visualizer.className = 'visualizer';

            // 새로운 캔버스 추가
            const canvas = document.createElement('canvas');
            visualizer.appendChild(canvas);
            document.getElementById('visualizers-container').appendChild(visualizer);
            const canvasCtx = canvas.getContext('2d');

            visualizerCount++;
            updateVisualizer(analyser, canvasCtx);
        }

        // 파동형 그래픽 업데이트 함수
        function updateVisualizer(analyser, canvasCtx) {
            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function draw() {
                requestAnimationFrame(draw);
                analyser.getByteTimeDomainData(dataArray);

                canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

                canvasCtx.beginPath();
                let sliceWidth = canvasCtx.canvas.width * 1.0 / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    let v = dataArray[i] / 128.0;
                    let y = v * canvasCtx.canvas.height / 2;

                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                canvasCtx.lineTo(canvasCtx.canvas.width, canvasCtx.canvas.height / 2);
                canvasCtx.stroke();
            }
            draw();
        }