
        // Firebase 설정
        const firebaseConfig = {
            apiKey: "AIzaSyAv0y8cF86kDC-saDZA6K0Q5fZd6dk9H1Y",
            authDomain: "suggestion-system-58def.firebaseapp.com",
            projectId: "suggestion-system-58def",
            storageBucket: "suggestion-system-58def.firebasestorage.app",
            messagingSenderId: "755050605021",
            appId: "1:755050605021:web:befd52c5516c3a3d3e2e34"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        // Firebase 캐싱 활성화 (읽기 횟수 대폭 감소)
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn('⚠️ 여러 탭이 열려있어 캐싱을 활성화할 수 없습니다.');
                } else if (err.code == 'unimplemented') {
                    console.warn('⚠️ 브라우저가 캐싱을 지원하지 않습니다.');
                }
            });

        // 전역 변수
        let currentUser = null;
        let currentVerifier = null;
        let currentSuggestion = null;

        // 유형효과 점수 기준
        const effectScoreRanges = [
            { min: 0, max: 500000, score: 15 },
            { min: 500001, max: 1000000, score: 20 },
            { min: 1000001, max: 5000000, score: 25 },
            { min: 5000001, max: 10000000, score: 30 },
            { min: 10000001, max: 20000000, score: 35 },
            { min: 20000001, max: 30000000, score: 40 },
            { min: 30000001, max: 40000000, score: 45 },
            { min: 40000001, max: 50000000, score: 50 },
            { min: 50000001, max: Infinity, score: 55 } // 별도심사
        ];

        // 인증 확인
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            currentUser = user;

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    showToast('사용자 정보를 찾을 수 없습니다.', 'error');
                    auth.signOut();
                    return;
                }

                const userData = userDoc.data();

                // roles 배열이 없으면 기본값 설정 (기존 시스템 호환)
                if (!userData.roles || userData.roles.length === 0) {
                    const defaultRoles = ['user'];
                    if (userData.role === 'admin') defaultRoles.push('admin');
                    if (userData.isEvaluator) {
                        if (userData.leaderLevel === 1) defaultRoles.push('firstReviewer');
                        else if (userData.leaderLevel === 2) defaultRoles.push('secondReviewer');
                        else if (userData.leaderLevel === 3) defaultRoles.push('thirdReviewer');
                        else defaultRoles.push('firstReviewer');
                    }
                    try {
                        await db.collection('users').doc(user.uid).update({ roles: defaultRoles });
                        userData.roles = defaultRoles;
                    } catch (updateError) {
                        userData.roles = defaultRoles;
                    }
                }

                currentVerifier = userData;

                // 검증담당자 권한 확인
                if (!userData.roles.includes('effectVerifier')) {
                    showToast('유형효과 검증담당자 권한이 없습니다.', 'error');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                    return;
                }

                // 사용자 정보 표시
                document.getElementById('userInfo').innerHTML = `
                    <strong>${userData.displayName}</strong><br>
                    ${userData.department || ''}<br>
                    유형효과 검증담당자
                `;

                // 데이터 로드
                loadDashboard();
                loadPendingVerifications();
                loadCompletedVerifications();
                loadStats();

            } catch (error) {
                console.error('사용자 정보 로드 오류:', error);
                showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
            }
        });

        // 대시보드 로드
        async function loadDashboard() {
            try {
                // 검증 대기 건수
                const pendingSnapshot = await db.collection('suggestions')
                    .where('hasTypicalEffect', '==', true)
                    .where('effectVerification.status', '==', 'pending')
                    .get();

                const pendingCount = pendingSnapshot.size;
                document.getElementById('statPending').textContent = pendingCount;
                document.getElementById('pendingCount').textContent = pendingCount;

                // 오늘 검증
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todaySnapshot = await db.collection('suggestions')
                    .where('effectVerification.verifierId', '==', currentVerifier.employeeId)
                    .where('effectVerification.verifiedAt', '>=', today)
                    .get();

                document.getElementById('statToday').textContent = todaySnapshot.size;

                // 이번 달 검증
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);

                const monthSnapshot = await db.collection('suggestions')
                    .where('effectVerification.verifierId', '==', currentVerifier.employeeId)
                    .where('effectVerification.verifiedAt', '>=', monthStart)
                    .get();

                document.getElementById('statMonth').textContent = monthSnapshot.size;

                // 평균 조정률 계산
                let totalAdjustRate = 0;
                let count = 0;
                monthSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.effectVerification && data.effectVerification.originalAmount > 0) {
                        const rate = (data.effectVerification.verifiedAmount / data.effectVerification.originalAmount) * 100;
                        totalAdjustRate += rate;
                        count++;
                    }
                });

                const avgRate = count > 0 ? Math.round(totalAdjustRate / count) : 100;
                document.getElementById('statAdjustRate').textContent = avgRate + '%';

                // 최근 검증 대기 제안서 (최대 5개)
                const recentDocs = pendingSnapshot.docs.slice(0, 5);
                displayRecentPending(recentDocs);

            } catch (error) {
                console.error('대시보드 로드 오류:', error);
            }
        }

        // 최근 검증 대기 제안서 표시
        function displayRecentPending(docs) {
            const tbody = document.getElementById('recentPendingList');

            if (docs.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                            검증 대기 중인 제안서가 없습니다.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = docs.map(doc => {
                const data = doc.data();
                const waitDays = calculateWaitDays(data.createdAt);
                return `
                    <tr>
                        <td>${data.suggestionNumber}</td>
                        <td>${data.proposer}</td>
                        <td>${data.title}</td>
                        <td style="text-align: right; font-weight: 600; color: #28a745;">
                            ${formatNumber(data.expectedSaving)}원
                        </td>
                        <td>${waitDays}일</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="openVerifyModal('${doc.id}')">
                                검증하기
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // 검증 대기 목록 로드
        async function loadPendingVerifications() {
            try {
                const snapshot = await db.collection('suggestions')
                    .where('hasTypicalEffect', '==', true)
                    .where('effectVerification.status', '==', 'pending')
                    .get();

                const tbody = document.getElementById('pendingList');

                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                                검증 대기 중인 제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                // 클라이언트에서 정렬 (오래된 순)
                const sortedDocs = snapshot.docs.sort((a, b) => {
                    const timeA = a.data().createdAt?.toDate?.() || new Date(0);
                    const timeB = b.data().createdAt?.toDate?.() || new Date(0);
                    return timeA - timeB; // 오래된 순
                });

                tbody.innerHTML = sortedDocs.map(doc => {
                    const data = doc.data();
                    const waitDays = calculateWaitDays(data.createdAt);
                    return `
                        <tr>
                            <td>${data.suggestionNumber}</td>
                            <td>${data.proposer}</td>
                            <td>${data.department}</td>
                            <td><strong>${data.title}</strong></td>
                            <td style="text-align: right; font-weight: 600; color: #28a745;">
                                ${formatNumber(data.expectedSaving)}
                            </td>
                            <td>${formatDate(data.createdAt)}</td>
                            <td style="text-align: center;">
                                <span class="${waitDays > 3 ? 'status-rejected' : 'status-pending'}">${waitDays}일</span>
                            </td>
                            <td>
                                <button class="btn btn-primary btn-sm" onclick="openVerifyModal('${doc.id}')">
                                    검증하기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

            } catch (error) {
                console.error('검증 대기 목록 로드 오류:', error);
                showToast('목록을 불러오는데 실패했습니다.', 'error');
            }
        }

        // 검증 완료 목록 로드
        async function loadCompletedVerifications() {
            try {
                const snapshot = await db.collection('suggestions')
                    .where('effectVerification.verifierId', '==', currentVerifier.employeeId)
                    .where('effectVerification.status', '==', 'completed')
                    .get();

                const tbody = document.getElementById('completedList');

                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                                검증 완료된 제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                // 클라이언트에서 정렬 및 제한 (최신순, 50개)
                const sortedDocs = snapshot.docs.sort((a, b) => {
                    const timeA = a.data().effectVerification?.verifiedAt?.toDate?.() || new Date(0);
                    const timeB = b.data().effectVerification?.verifiedAt?.toDate?.() || new Date(0);
                    return timeB - timeA; // 최신순
                }).slice(0, 50);

                tbody.innerHTML = sortedDocs.map(doc => {
                    const data = doc.data();
                    const verification = data.effectVerification;
                    const adjustRate = verification.originalAmount > 0
                        ? Math.round((verification.verifiedAmount / verification.originalAmount) * 100)
                        : 100;

                    return `
                        <tr>
                            <td>${data.suggestionNumber}</td>
                            <td>${data.proposer}</td>
                            <td>${data.title}</td>
                            <td style="text-align: right;">
                                ${formatNumber(verification.originalAmount)}원
                            </td>
                            <td style="text-align: right; font-weight: 600; color: #28a745;">
                                ${formatNumber(verification.verifiedAmount)}원
                            </td>
                            <td style="text-align: center;">
                                <span class="status-${adjustRate >= 80 ? 'completed' : 'rejected'}">${adjustRate}%</span>
                            </td>
                            <td>${formatDate(verification.verifiedAt)}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="viewVerification('${doc.id}')">
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

            } catch (error) {
                console.error('검증 완료 목록 로드 오류:', error);
            }
        }

        // 전체 제안 로드
        async function loadAllSuggestions() {
            try {
                console.log('📚 전체 제안 로드 시작...');

                // 모든 사용자의 제안 조회 (orderBy 제거하여 권한 문제 해결)
                const snapshot = await db.collection('suggestions')
                    .limit(1000)
                    .get();

                console.log('📝 전체 제안 로드 완료:', snapshot.size, '개');
                const tbody = document.getElementById('allSuggestionsList');

                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                                제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                // 클라이언트에서 정렬 (최신순)
                const sortedDocs = snapshot.docs.sort((a, b) => {
                    const timeA = a.data().createdAt?.toDate?.() || new Date(0);
                    const timeB = b.data().createdAt?.toDate?.() || new Date(0);
                    return timeB - timeA;
                });

                tbody.innerHTML = sortedDocs.map(doc => {
                    const data = doc.data();
                    const statusText = {
                        'draft': '임시저장',
                        'pending': '결재대기',
                        'reviewing': '검토중',
                        'approved': '승인',
                        'rejected': '반려'
                    }[data.status] || data.status;

                    const statusClass = {
                        'draft': 'badge-secondary',
                        'pending': 'badge-warning',
                        'reviewing': 'badge-info',
                        'approved': 'badge-success',
                        'rejected': 'badge-danger'
                    }[data.status] || 'badge-secondary';

                    return `
                        <tr>
                            <td>${data.suggestionNumber || '-'}</td>
                            <td>${data.proposer || '-'}</td>
                            <td>${data.department || '-'}</td>
                            <td>${data.title || '-'}</td>
                            <td>
                                <span class="badge ${statusClass}">
                                    ${statusText}
                                </span>
                            </td>
                            <td>${formatDate(data.createdAt)}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="viewSuggestion('${doc.id}')">
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

            } catch (error) {
                console.error('전체 제안 목록 로드 오류:', error);
                const tbody = document.getElementById('allSuggestionsList');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                            전체 제안을 불러오는데 실패했습니다: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }

        // 통계 로드
        async function loadStats() {
            try {
                const snapshot = await db.collection('suggestions')
                    .where('effectVerification.verifierId', '==', currentVerifier.employeeId)
                    .where('effectVerification.status', '==', 'completed')
                    .get();

                const total = snapshot.size;
                let totalAmount = 0;
                let totalAdjustRate = 0;
                let totalProcessTime = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const verification = data.effectVerification;

                    totalAmount += verification.verifiedAmount || 0;

                    if (verification.originalAmount > 0) {
                        totalAdjustRate += (verification.verifiedAmount / verification.originalAmount) * 100;
                    }

                    // 처리 시간 계산 (제출일 ~ 검증일)
                    if (data.createdAt && verification.verifiedAt) {
                        const submitDate = data.createdAt.toDate();
                        const verifyDate = verification.verifiedAt.toDate();
                        const diffDays = Math.floor((verifyDate - submitDate) / (1000 * 60 * 60 * 24));
                        totalProcessTime += diffDays;
                    }
                });

                document.getElementById('statsTotal').textContent = total;
                document.getElementById('statsAvgAmount').textContent =
                    total > 0 ? formatNumber(Math.round(totalAmount / total)) + '원' : '0원';
                document.getElementById('statsAvgAdjustRate').textContent =
                    total > 0 ? Math.round(totalAdjustRate / total) + '%' : '100%';
                document.getElementById('statsAvgTime').textContent =
                    total > 0 ? Math.round(totalProcessTime / total) + '일' : '0일';

            } catch (error) {
                console.error('통계 로드 오류:', error);
            }
        }

        // 검증 모달 열기
        async function openVerifyModal(suggestionId) {
            try {
                const doc = await db.collection('suggestions').doc(suggestionId).get();
                if (!doc.exists) {
                    showToast('제안서를 찾을 수 없습니다.', 'error');
                    return;
                }

                const data = doc.data();
                currentSuggestion = { id: suggestionId, ...data };

                // 모달에 데이터 채우기
                document.getElementById('modalSugNumber').textContent = data.suggestionNumber;
                document.getElementById('modalProposer').textContent = `${data.proposer} (${data.department})`;
                document.getElementById('modalDepartment').textContent = data.department;
                document.getElementById('modalSubmitDate').textContent = formatDate(data.createdAt);
                document.getElementById('modalTitle').textContent = data.title;
                document.getElementById('modalCurrentSituation').textContent = data.currentSituation;
                document.getElementById('modalImprovementPlan').textContent = data.improvementPlan;
                document.getElementById('modalExpectedSaving').textContent = formatNumber(data.expectedSaving);
                document.getElementById('modalSavingBasis').textContent = data.savingBasis || '(산출 근거 없음)';

                // 입력 필드 초기화
                document.getElementById('verifiedAmount').value = '';
                document.getElementById('adjustmentReason').value = '';
                document.getElementById('verificationNote').value = '';
                document.getElementById('effectScoreDisplay').style.display = 'none';

                // 모달 표시
                document.getElementById('verifyModal').classList.add('show');

            } catch (error) {
                console.error('모달 열기 오류:', error);
                showToast('제안서를 불러오는데 실패했습니다.', 'error');
            }
        }

        // 검증 모달 닫기
        function closeVerifyModal() {
            document.getElementById('verifyModal').classList.remove('show');
            currentSuggestion = null;
        }

        // 유형효과 점수 자동 계산
        function calculateEffectScore() {
            const amount = parseInt(document.getElementById('verifiedAmount').value) || 0;

            if (amount === 0) {
                document.getElementById('effectScoreDisplay').style.display = 'none';
                return;
            }

            let score = 0;
            for (let range of effectScoreRanges) {
                if (amount >= range.min && amount <= range.max) {
                    score = range.score;
                    break;
                }
            }

            document.getElementById('effectScoreValue').textContent = score;
            document.getElementById('effectScoreDisplay').style.display = 'block';
        }

        // 검증 완료 처리
        async function completeVerification() {
            const verifiedAmount = parseInt(document.getElementById('verifiedAmount').value);
            const adjustmentReason = document.getElementById('adjustmentReason').value;
            const verificationNote = document.getElementById('verificationNote').value;

            if (!verifiedAmount && verifiedAmount !== 0) {
                showToast('확정 금액을 입력해주세요.', 'error');
                return;
            }

            // 예상 금액과 다를 경우 조정 사유 필수
            const originalAmount = currentSuggestion.expectedSaving || 0;
            if (Math.abs(verifiedAmount - originalAmount) > originalAmount * 0.1 && !adjustmentReason) {
                showToast('금액 조정 사유를 입력해주세요. (예상 금액과 10% 이상 차이)', 'error');
                return;
            }

            if (!confirm('검증을 완료하시겠습니까? 완료 후 제안서는 평가 단계로 진행됩니다.')) return;

            try {
                // 유형효과 점수 계산
                let effectScore = 0;
                for (let range of effectScoreRanges) {
                    if (verifiedAmount >= range.min && verifiedAmount <= range.max) {
                        effectScore = range.score;
                        break;
                    }
                }

                const verification = {
                    needsVerification: true,
                    status: 'completed',
                    originalAmount: originalAmount,
                    verifiedAmount: verifiedAmount,
                    typicalEffectScore: effectScore,
                    verificationNote: verificationNote,
                    adjustmentReason: adjustmentReason,
                    verifierId: currentVerifier.employeeId,
                    verifierName: currentVerifier.displayName,
                    verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('suggestions').doc(currentSuggestion.id).update({
                    effectVerification: verification,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 알림 생성
                await db.collection('notifications').add({
                    userId: currentSuggestion.userId,
                    title: '유형효과 검증 완료',
                    message: `${currentSuggestion.suggestionNumber} 제안서의 유형효과 검증이 완료되었습니다. 확정 금액: ${formatNumber(verifiedAmount)}원/년`,
                    type: 'verification',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('검증이 완료되었습니다. 평가 단계로 전달됩니다.', 'success');
                closeVerifyModal();

                // 데이터 새로고침
                loadDashboard();
                loadPendingVerifications();
                loadCompletedVerifications();
                loadStats();

            } catch (error) {
                console.error('검증 완료 오류:', error);
                showToast('처리 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        }

        // 검증 불가 처리
        async function rejectVerification() {
            const reason = document.getElementById('adjustmentReason').value;

            if (!reason) {
                showToast('검증 불가 사유를 반드시 입력해주세요.', 'error');
                return;
            }

            if (!confirm('검증 불가 처리하시겠습니까? 제안서는 제안자에게 반려됩니다.')) return;

            try {
                const verification = {
                    needsVerification: true,
                    status: 'rejected',
                    originalAmount: currentSuggestion.expectedSaving || 0,
                    verifiedAmount: 0,
                    typicalEffectScore: 0,
                    verificationNote: reason,
                    verifierId: currentVerifier.employeeId,
                    verifierName: currentVerifier.displayName,
                    verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('suggestions').doc(currentSuggestion.id).update({
                    effectVerification: verification,
                    status: 'rejected',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 알림 생성
                await db.collection('notifications').add({
                    userId: currentSuggestion.userId,
                    title: '유형효과 검증 불가',
                    message: `${currentSuggestion.suggestionNumber} 제안서가 검증 불가 처리되었습니다. 사유: ${reason}`,
                    type: 'verification',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('검증 불가 처리되었습니다.', 'success');
                closeVerifyModal();

                // 데이터 새로고침
                loadDashboard();
                loadPendingVerifications();

            } catch (error) {
                console.error('검증 불가 처리 오류:', error);
                showToast('처리 중 오류가 발생했습니다.', 'error');
            }
        }

        // 추가 자료 요청
        async function requestMoreInfo() {
            const reason = document.getElementById('verificationNote').value;

            if (!reason) {
                showToast('추가 자료 요청 사항을 입력해주세요.', 'error');
                return;
            }

            if (!confirm('추가 자료를 요청하시겠습니까?')) return;

            try {
                // 알림 생성
                await db.collection('notifications').add({
                    userId: currentSuggestion.userId,
                    title: '유형효과 검증 - 추가 자료 요청',
                    message: `${currentSuggestion.suggestionNumber}: ${reason}`,
                    type: 'verification',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('추가 자료 요청이 전송되었습니다.', 'success');
                closeVerifyModal();

            } catch (error) {
                console.error('추가 자료 요청 오류:', error);
                showToast('처리 중 오류가 발생했습니다.', 'error');
            }
        }

        // 검증 내역 상세보기
        async function viewVerification(suggestionId) {
            await openVerifyModal(suggestionId);

            // 기존 검증 데이터 로드
            const doc = await db.collection('suggestions').doc(suggestionId).get();
            const data = doc.data();

            if (data.effectVerification) {
                document.getElementById('verifiedAmount').value = data.effectVerification.verifiedAmount || '';
                document.getElementById('adjustmentReason').value = data.effectVerification.adjustmentReason || '';
                document.getElementById('verificationNote').value = data.effectVerification.verificationNote || '';

                if (data.effectVerification.verifiedAmount) {
                    calculateEffectScore();
                }
            }

            // 관리자 권한 확인
            const isAdmin = currentVerifier.roles && currentVerifier.roles.includes('admin');

            if (isAdmin) {
                // 관리자는 수정 가능
                document.getElementById('verifiedAmount').disabled = false;
                document.getElementById('adjustmentReason').disabled = false;
                document.getElementById('verificationNote').disabled = false;
                document.querySelector('.modal-footer').innerHTML = `
                    <button class="btn btn-secondary" onclick="closeVerifyModal()">닫기</button>
                    <button class="btn btn-success" onclick="updateVerification('${suggestionId}')">수정 저장</button>
                `;
            } else {
                // 일반 검증자는 읽기만 가능
                document.getElementById('verifiedAmount').disabled = true;
                document.getElementById('adjustmentReason').disabled = true;
                document.getElementById('verificationNote').disabled = true;
                document.querySelector('.modal-footer').innerHTML = `
                    <button class="btn btn-secondary" onclick="closeVerifyModal()">닫기</button>
                `;
            }
        }

        // 검증 정보 수정 (관리자 전용)
        async function updateVerification(suggestionId) {
            const verifiedAmount = parseInt(document.getElementById('verifiedAmount').value);
            const adjustmentReason = document.getElementById('adjustmentReason').value;
            const verificationNote = document.getElementById('verificationNote').value;

            if (!verifiedAmount && verifiedAmount !== 0) {
                showToast('확정 금액을 입력해주세요.', 'error');
                return;
            }

            if (!confirm('검증 정보를 수정하시겠습니까?')) return;

            try {
                // 유형효과 점수 재계산
                let effectScore = 0;
                for (let range of effectScoreRanges) {
                    if (verifiedAmount >= range.min && verifiedAmount <= range.max) {
                        effectScore = range.score;
                        break;
                    }
                }

                const doc = await db.collection('suggestions').doc(suggestionId).get();
                const existingVerification = doc.data().effectVerification || {};

                const updatedVerification = {
                    ...existingVerification,
                    verifiedAmount: verifiedAmount,
                    typicalEffectScore: effectScore,
                    adjustmentReason: adjustmentReason,
                    verificationNote: verificationNote,
                    lastModifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModifiedBy: currentVerifier.displayName
                };

                await db.collection('suggestions').doc(suggestionId).update({
                    effectVerification: updatedVerification,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('검증 정보가 수정되었습니다.', 'success');
                closeVerifyModal();

                // 데이터 새로고침
                loadDashboard();
                loadCompletedVerifications();

            } catch (error) {
                console.error('검증 정보 수정 오류:', error);
                showToast('수정 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        }

        // 유틸리티 함수
        function formatDate(timestamp) {
            if (!timestamp) return '-';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('ko-KR');
        }

        function formatNumber(num) {
            if (!num && num !== 0) return '0';
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        function calculateWaitDays(timestamp) {
            if (!timestamp) return 0;
            const submitDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const today = new Date();
            return Math.floor((today - submitDate) / (1000 * 60 * 60 * 24));
        }

        function showSection(sectionId) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');

            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');

            // 섹션별 데이터 로드
            if (sectionId === 'allSuggestions') {
                loadAllSuggestions();
            }
        }

        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast ${type} show`;
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function logout() {
            if (confirm('로그아웃 하시겠습니까?')) {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                }).catch(error => {
                    console.error('로그아웃 오류:', error);
                    showToast('로그아웃 중 오류가 발생했습니다.', 'error');
                });
            }
        }

        // AI 분석 요청 (Netlify Function 사용)
        async function requestAIAnalysis() {
            if (!currentSuggestion) {
                showToast('제안서 정보를 불러오지 못했습니다.', 'error');
                return;
            }

            const btn = document.getElementById('aiRequestBtn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '🤖 AI 분석 중...';

            try {
                // Netlify Function 호출
                const response = await fetch('/.netlify/functions/openai-analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        suggestionData: {
                            title: currentSuggestion.title,
                            proposer: currentSuggestion.proposer,
                            department: currentSuggestion.department,
                            currentSituation: currentSuggestion.currentSituation,
                            improvementPlan: currentSuggestion.improvementPlan,
                            expectedSaving: formatNumber(currentSuggestion.expectedSaving),
                            savingBasis: currentSuggestion.savingBasis || '제공되지 않음'
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'API 요청 실패');
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'AI 분석 실패');
                }

                // AI 응답 표시
                document.getElementById('aiAnalysisContent').textContent = data.analysis;
                document.getElementById('aiAnalysisResult').style.display = 'block';

                showToast('AI 분석이 완료되었습니다.', 'success');

            } catch (error) {
                console.error('AI 분석 오류:', error);
                showToast('AI 분석 중 오류가 발생했습니다: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }

        // AI 분석 결과 닫기
        function closeAIAnalysis() {
            document.getElementById('aiAnalysisResult').style.display = 'none';
        }
    