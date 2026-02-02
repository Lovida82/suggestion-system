
        // Firebase 설정
        const firebaseConfig = {
            apiKey: "AIzaSyAv0y8cF86kDC-saDZA6K0Q5fZd6dk9H1Y",
            authDomain: "suggestion-system-58def.firebaseapp.com",
            projectId: "suggestion-system-58def",
            storageBucket: "suggestion-system-58def.firebasestorage.app",
            messagingSenderId: "755050605021",
            appId: "1:755050605021:web:befd52c5516c3a3d3e2e34"
        };

        console.log('🚀🚀🚀 leader.html 스크립트 시작 🚀🚀🚀');

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();

        console.log('✅ Firebase 초기화 완료');

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
        let currentLeader = null;
        let currentSuggestion = null;
        let allSuggestions = [];

        console.log('✅ 전역 변수 초기화 완료');

        // 인증 확인
        console.log('🔐 인증 리스너 등록 중...');
        auth.onAuthStateChanged(async (user) => {
            console.log('🔐 onAuthStateChanged 호출됨, user:', user ? user.email : 'null');
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
                        else defaultRoles.push('firstReviewer'); // 기본값
                    }
                    try {
                        await db.collection('users').doc(user.uid).update({ roles: defaultRoles });
                        userData.roles = defaultRoles;
                    } catch (updateError) {
                        userData.roles = defaultRoles;
                    }
                }

                // employees 컬렉션에서 employeeId 가져오기
                let employeeId = userData.employeeId; // users 컬렉션에 있으면 사용

                if (!employeeId) {
                    console.log('⚠️ users 컬렉션에 employeeId 없음, employees 컬렉션에서 검색...');
                    const employeeQuery = await db.collection('employees')
                        .where('email', '==', user.email)
                        .where('isActive', '==', true)
                        .get();

                    if (!employeeQuery.empty) {
                        employeeId = employeeQuery.docs[0].id;
                        console.log('✅ employees 컬렉션에서 employeeId 찾음:', employeeId);
                    } else {
                        console.error('❌ employees 컬렉션에서도 사용자를 찾을 수 없습니다.');
                    }
                }

                // currentLeader 객체 명시적 구성 (dashboard.html과 동일한 방식)
                currentLeader = {
                    uid: user.uid,
                    email: user.email,
                    displayName: userData.displayName,
                    department: userData.department,
                    employeeId: employeeId,
                    role: userData.role,
                    roles: userData.roles || ['user'],
                    isEvaluator: userData.isEvaluator,
                    leaderLevel: userData.leaderLevel
                };

                console.log('👤 currentLeader 설정 완료:', currentLeader);
                console.log('🔑 employeeId:', currentLeader.employeeId);

                // 리더 권한 확인 (roles 배열 또는 isEvaluator 확인)
                const hasReviewerRole = userData.roles.includes('firstReviewer') ||
                                       userData.roles.includes('secondReviewer') ||
                                       userData.roles.includes('thirdReviewer') ||
                                       userData.isEvaluator === true;

                if (!hasReviewerRole) {
                    showToast('평가자 권한이 없습니다.', 'error');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                    return;
                }

                // 사용자 정보 표시
                document.getElementById('userInfo').innerHTML = `
                    <strong>${userData.displayName}</strong><br>
                    ${userData.department || ''}<br>
                    ${userData.jobTitle || '리더'}
                `;

                // 데이터 로드
                console.log('📊 데이터 로드 함수 호출 시작...');
                console.log('  - loadDashboard 호출');
                loadDashboard();
                console.log('  - loadPendingSuggestions 호출');
                loadPendingSuggestions();
                console.log('  - loadReviewingSuggestions 호출');
                loadReviewingSuggestions();
                console.log('  - loadCompletedSuggestions 호출');
                loadCompletedSuggestions();
                console.log('  - loadStats 호출');
                loadStats();
                console.log('✅ 모든 데이터 로드 함수 호출 완료');

            } catch (error) {
                console.error('사용자 정보 로드 오류:', error);
                showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
            }
        });

        // 대시보드 로드
        async function loadDashboard() {
            try {
                // 결재 대기 건수
                const pendingSnapshot = await db.collection('suggestions')
                    .where('currentApproverId', '==', currentLeader.employeeId)
                    .where('status', '==', 'pending')
                    .get();

                const pendingCount = pendingSnapshot.size;
                document.getElementById('statPending').textContent = pendingCount;
                document.getElementById('pendingCount').textContent = pendingCount;

                // 이번 주 처리 건수
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);

                const weekSnapshot = await db.collection('suggestions')
                    .where('level1Approval.approverId', '==', currentLeader.employeeId)
                    .where('level1Approval.approvedAt', '>=', weekAgo)
                    .get();

                document.getElementById('statWeek').textContent = weekSnapshot.size;

                // 이번 달 처리 건수
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);

                const monthSnapshot = await db.collection('suggestions')
                    .where('level1Approval.approverId', '==', currentLeader.employeeId)
                    .where('level1Approval.approvedAt', '>=', monthStart)
                    .get();

                document.getElementById('statMonth').textContent = monthSnapshot.size;

                // 최근 결재 대기 제안서 (최대 5개)
                const recentDocs = pendingSnapshot.docs.slice(0, 5);
                displayRecentPending(recentDocs);

            } catch (error) {
                console.error('대시보드 로드 오류:', error);
            }
        }

        // 최근 결재 대기 제안서 표시
        function displayRecentPending(docs) {
            const tbody = document.getElementById('recentPendingList');

            if (docs.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                            결재 대기 중인 제안서가 없습니다.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = docs.map(doc => {
                const data = doc.data();
                return `
                    <tr>
                        <td>${data.suggestionNumber}</td>
                        <td>${data.proposer}</td>
                        <td>${data.department}</td>
                        <td>${data.title}</td>
                        <td>${formatDate(data.createdAt)}</td>
                        <td>
                            <button class="btn btn-primary btn-sm recent-review-btn" data-suggestion-id="${doc.id}">
                                평가하기
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // 이벤트 리스너 등록
            console.log('🔘 최근 제안 평가하기 버튼 이벤트 리스너 등록 중...');
            document.querySelectorAll('.recent-review-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const suggestionId = this.getAttribute('data-suggestion-id');
                    console.log('🔘 최근 제안 버튼 클릭됨:', suggestionId);
                    openReviewModal(suggestionId);
                });
            });
            console.log('✅ 최근 제안 이벤트 리스너 등록 완료, 버튼 개수:', document.querySelectorAll('.recent-review-btn').length);
        }

        // 결재 대기 목록 로드
        async function loadPendingSuggestions() {
            try {
                console.log('==========================================');
                console.log('📋📋📋 결재 대기 목록 로드 시작 📋📋📋');
                console.log('==========================================');
                console.log('currentLeader:', currentLeader);
                console.log('employeeId:', currentLeader?.employeeId);
                console.log('window.openReviewModal 존재:', typeof window.openReviewModal);

                const snapshot = await db.collection('suggestions')
                    .where('currentApproverId', '==', currentLeader.employeeId)
                    .where('status', '==', 'pending')
                    .get();

                console.log('📦 결재 대기 쿼리 완료, 문서 수:', snapshot.size);

                const tbody = document.getElementById('pendingList');

                // 클라이언트에서 정렬
                const myPending = snapshot.docs.sort((a, b) => {
                    const timeA = a.data().createdAt?.toDate?.() || new Date(0);
                    const timeB = b.data().createdAt?.toDate?.() || new Date(0);
                    return timeB - timeA; // 최신순
                });

                if (myPending.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                                결재 대기 중인 제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = myPending.map(doc => {
                    const data = doc.data();
                    const selfScore = data.scores?.self?.total || 0;
                    const selfGrade = data.scores?.self?.grade || '-';
                    return `
                        <tr>
                            <td>${data.suggestionNumber || '-'}</td>
                            <td>${data.proposer || '-'}</td>
                            <td>${data.department || '-'}</td>
                            <td><strong>${data.title || '-'}</strong></td>
                            <td>${formatDate(data.createdAt)}</td>
                            <td>
                                <div style="text-align: center;">
                                    <div style="font-size: 18px; font-weight: 600; color: #667eea;">${selfScore}</div>
                                    <div style="font-size: 11px; color: #999;">${selfGrade}</div>
                                </div>
                            </td>
                            <td>
                                <button class="btn btn-primary btn-sm review-btn" data-suggestion-id="${doc.id}">
                                    평가하기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // 이벤트 리스너 등록 (이전 리스너는 innerHTML로 이미 제거됨)
                console.log('🔘 평가하기 버튼 이벤트 리스너 등록 중...');
                console.log('현재 시각:', new Date().toLocaleTimeString());

                // DOM이 업데이트될 시간을 주기 위해 setTimeout 사용
                setTimeout(() => {
                    console.log('⏰ setTimeout 실행됨 (100ms 후)');
                    const reviewButtons = document.querySelectorAll('#pendingList .review-btn');
                    console.log('발견된 버튼:', reviewButtons.length);
                    console.log('전체 DOM 내 .review-btn:', document.querySelectorAll('.review-btn').length);
                    console.log('pendingList 요소 존재:', !!document.getElementById('pendingList'));

                    if (reviewButtons.length === 0) {
                        console.warn('⚠️⚠️⚠️ 버튼을 찾을 수 없습니다! ⚠️⚠️⚠️');
                        const pendingList = document.getElementById('pendingList');
                        if (pendingList) {
                            console.log('pendingList innerHTML (처음 500자):', pendingList.innerHTML.substring(0, 500));
                        } else {
                            console.error('❌ pendingList 요소 자체가 없습니다!');
                        }
                        return;
                    }

                    console.log('✅ 버튼을 찾았습니다. 이벤트 리스너 등록 시작...');

                    reviewButtons.forEach((btn, index) => {
                        const suggestionId = btn.getAttribute('data-suggestion-id');
                        console.log(`[${index}] 버튼 ID: ${suggestionId}`);

                        // 클릭 핸들러 정의
                        const clickHandler = function(e) {
                            console.log('##########################################');
                            console.log('### 🔘 버튼 클릭 이벤트 발생! ###');
                            console.log('##########################################');
                            e.preventDefault();
                            e.stopPropagation();
                            const id = this.getAttribute('data-suggestion-id');
                            console.log('클릭된 제안 ID:', id);

                            if (typeof window.openReviewModal === 'function') {
                                console.log('✅ openReviewModal 함수 발견, 호출 시작...');
                                try {
                                    window.openReviewModal(id);
                                } catch (err) {
                                    console.error('❌ openReviewModal 호출 중 오류:', err);
                                }
                            } else {
                                console.error('❌ openReviewModal 함수가 window 객체에 없습니다!');
                                console.log('typeof window.openReviewModal:', typeof window.openReviewModal);
                            }
                        };

                        btn.addEventListener('click', clickHandler);
                        console.log(`  → 리스너 등록 완료`);
                    });
                    console.log('✅✅✅ 모든 이벤트 리스너 등록 완료! ✅✅✅');
                }, 100);

            } catch (error) {
                console.error('결재 대기 목록 로드 오류:', error);
                showToast('목록을 불러오는데 실패했습니다.', 'error');
            }
        }

        // 검토 중 목록 로드
        async function loadReviewingSuggestions() {
            try {
                const snapshot = await db.collection('suggestions')
                    .where('approvalStatus', 'in', ['level1', 'level2'])
                    .get();

                const tbody = document.getElementById('reviewingList');

                // 내가 이미 승인한 제안서만 필터링
                let myReviewing = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    return (data.level1Approval && data.level1Approval.approverId === currentLeader.employeeId) ||
                           (data.level2Approval && data.level2Approval.approverId === currentLeader.employeeId);
                });

                // 클라이언트에서 정렬
                myReviewing = myReviewing.sort((a, b) => {
                    const timeA = a.data().createdAt?.toDate?.() || new Date(0);
                    const timeB = b.data().createdAt?.toDate?.() || new Date(0);
                    return timeB - timeA; // 최신순
                });

                if (myReviewing.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                                검토 중인 제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    document.getElementById('reviewingCount').textContent = '0';
                    return;
                }

                document.getElementById('reviewingCount').textContent = myReviewing.length;

                tbody.innerHTML = myReviewing.map(doc => {
                    const data = doc.data();
                    const myApproval = data.level1Approval?.approverId === currentLeader.employeeId 
                        ? data.level1Approval 
                        : data.level2Approval;

                    return `
                        <tr>
                            <td>${data.suggestionNumber}</td>
                            <td>${data.proposer}</td>
                            <td>${data.title}</td>
                            <td>
                                <span class="badge badge-success">승인</span>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">점수: ${myApproval.score}점</div>
                            </td>
                            <td>
                                <span class="badge badge-warning">
                                    ${data.approvalStatus === 'level1' ? '2차 결재 대기' : '최종 결재 대기'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="viewSuggestion('${doc.id}')">
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

            } catch (error) {
                console.error('검토 중 목록 로드 오류:', error);
            }
        }

        // 처리 완료 목록 로드
        async function loadCompletedSuggestions() {
            try {
                const snapshot = await db.collection('suggestions')
                    .where('approvalStatus', 'in', ['approved', 'rejected'])
                    .get();

                const tbody = document.getElementById('completedList');

                // 내가 처리한 제안서만 필터링
                let myCompleted = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    return (data.level1Approval && data.level1Approval.approverId === currentLeader.employeeId) ||
                           (data.level2Approval && data.level2Approval.approverId === currentLeader.employeeId) ||
                           (data.finalApproval && data.finalApproval.approverId === currentLeader.employeeId);
                });

                // 클라이언트에서 정렬 및 제한
                myCompleted = myCompleted.sort((a, b) => {
                    const timeA = a.data().updatedAt?.toDate?.() || new Date(0);
                    const timeB = b.data().updatedAt?.toDate?.() || new Date(0);
                    return timeB - timeA; // 최신순
                }).slice(0, 50);

                if (myCompleted.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                                처리 완료된 제안서가 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = myCompleted.map(doc => {
                    const data = doc.data();
                    const myApproval = data.level1Approval?.approverId === currentLeader.employeeId 
                        ? data.level1Approval 
                        : (data.level2Approval?.approverId === currentLeader.employeeId 
                            ? data.level2Approval 
                            : data.finalApproval);

                    return `
                        <tr>
                            <td>${data.suggestionNumber}</td>
                            <td>${data.proposer}</td>
                            <td>${data.title}</td>
                            <td>
                                <span class="badge ${myApproval.status === 'approved' ? 'badge-success' : 'badge-danger'}">
                                    ${myApproval.status === 'approved' ? '승인' : '반려'}
                                </span>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">점수: ${myApproval.score}점</div>
                            </td>
                            <td>
                                <span class="badge ${data.approvalStatus === 'approved' ? 'badge-success' : 'badge-danger'}">
                                    ${data.approvalStatus === 'approved' ? '최종 승인' : '반려'}
                                </span>
                            </td>
                            <td>${formatDate(myApproval.approvedAt)}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="viewSuggestion('${doc.id}')">
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

            } catch (error) {
                console.error('처리 완료 목록 로드 오류:', error);
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

                // 🔍 디버깅: 각 제안서의 currentApproverId와 status 확인
                console.log('🔍🔍🔍 디버깅: 각 제안서 상태 확인 🔍🔍🔍');
                let pendingCount = 0;
                let myPendingCount = 0;
                snapshot.docs.forEach((doc, index) => {
                    const data = doc.data();
                    if (data.status === 'pending') {
                        pendingCount++;
                        console.log(`  제안 ${index + 1}: ${data.suggestionNumber || doc.id}`);
                        console.log(`    - status: ${data.status}`);
                        console.log(`    - currentApproverId: ${data.currentApproverId}`);
                        console.log(`    - 내 ID (A211006)와 일치: ${data.currentApproverId === 'A211006'}`);
                        if (data.currentApproverId === currentLeader.employeeId) {
                            myPendingCount++;
                        }
                    }
                });
                console.log(`📊 전체 pending 상태 제안: ${pendingCount}개`);
                console.log(`📊 내가 결재해야 할 제안: ${myPendingCount}개`);
                console.log('🔍🔍🔍 디버깅 완료 🔍🔍🔍');
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
                const snapshot = await db.collection('suggestions').get();

                // 내가 처리한 제안서 필터링
                const myProcessed = snapshot.docs.filter(doc => {
                    const data = doc.data();
                    return (data.level1Approval && data.level1Approval.approverId === currentLeader.employeeId) ||
                           (data.level2Approval && data.level2Approval.approverId === currentLeader.employeeId) ||
                           (data.finalApproval && data.finalApproval.approverId === currentLeader.employeeId);
                });

                const total = myProcessed.length;
                const approved = myProcessed.filter(doc => {
                    const data = doc.data();
                    const myApproval = data.level1Approval?.approverId === currentLeader.employeeId 
                        ? data.level1Approval 
                        : (data.level2Approval?.approverId === currentLeader.employeeId 
                            ? data.level2Approval 
                            : data.finalApproval);
                    return myApproval && myApproval.status === 'approved';
                }).length;

                const rejected = myProcessed.filter(doc => {
                    const data = doc.data();
                    const myApproval = data.level1Approval?.approverId === currentLeader.employeeId 
                        ? data.level1Approval 
                        : (data.level2Approval?.approverId === currentLeader.employeeId 
                            ? data.level2Approval 
                            : data.finalApproval);
                    return myApproval && myApproval.status === 'rejected';
                }).length;

                const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

                document.getElementById('statsTotal').textContent = total;
                document.getElementById('statsApproved').textContent = approved;
                document.getElementById('statsRejected').textContent = rejected;
                document.getElementById('statsApprovalRate').textContent = approvalRate + '%';

            } catch (error) {
                console.error('통계 로드 오류:', error);
            }
        }

        // 모든 데이터 다시 로드
        function loadAllData() {
            loadDashboard();
            loadPendingSuggestions();
            loadReviewingSuggestions();
            loadCompletedSuggestions();
            loadStats();
        }

        // 평가 모달 열기
        async function openReviewModal(suggestionId) {
            console.log('🔍 openReviewModal 호출:', suggestionId);
            try {
                if (!db) {
                    console.error('❌ Firestore가 초기화되지 않았습니다.');
                    showToast('시스템 오류가 발생했습니다.', 'error');
                    return;
                }

                console.log('📄 제안서 조회 중...');
                const doc = await db.collection('suggestions').doc(suggestionId).get();

                if (!doc.exists) {
                    console.error('❌ 제안서를 찾을 수 없습니다:', suggestionId);
                    showToast('제안서를 찾을 수 없습니다.', 'error');
                    return;
                }

                const data = doc.data();
                console.log('✅ 제안서 데이터:', data);
                currentSuggestion = { id: suggestionId, ...data };

                // 모달에 데이터 채우기
                console.log('📝 모달에 데이터 입력 중...');
                try {
                    document.getElementById('modalSugNumber').textContent = data.suggestionNumber || '-';
                    document.getElementById('modalProposer').textContent = `${data.proposer || '-'} (${data.department || '-'})`;
                    document.getElementById('modalDepartment').textContent = data.department || '-';
                    document.getElementById('modalSubmitDate').textContent = formatDate(data.createdAt);
                    document.getElementById('modalTitle').textContent = data.title || '-';
                    document.getElementById('modalCurrentSituation').textContent = data.currentSituation || '-';
                    document.getElementById('modalImprovementPlan').textContent = data.improvementPlan || '-';
                    document.getElementById('modalTotalScore').textContent = data.scores?.self?.total || 0;
                    document.getElementById('modalSelfGrade').textContent = data.scores?.self?.grade || '-';

                    // 유형효과 검증 정보 표시
                    const verificationSection = document.getElementById('verificationInfoSection');
                    if (data.hasTypicalEffect && data.effectVerification && data.effectVerification.status === 'verified') {
                        // 검증이 완료된 경우 검증 정보 표시
                        verificationSection.style.display = 'block';

                        document.getElementById('modalOriginalAmount').textContent =
                            (data.effectVerification.originalAmount || 0).toLocaleString() + '원/년';
                        document.getElementById('modalVerifiedAmount').textContent =
                            (data.effectVerification.verifiedAmount || 0).toLocaleString() + '원/년';
                        document.getElementById('modalVerifierComment').textContent =
                            data.effectVerification.verifierComment || '-';
                        document.getElementById('modalVerifierName').textContent =
                            data.effectVerification.verifierName || '-';

                        const verifiedAt = data.effectVerification.verifiedAt?.toDate?.();
                        document.getElementById('modalVerifiedAt').textContent =
                            verifiedAt ? verifiedAt.toLocaleDateString('ko-KR') : '-';
                    } else {
                        // 유형효과가 없거나 검증이 완료되지 않은 경우 숨김
                        verificationSection.style.display = 'none';
                    }
                } catch (elemError) {
                    console.error('❌ 모달 요소 업데이트 오류:', elemError);
                }

                // 입력 필드 초기화
                console.log('🔄 입력 필드 초기화 중...');
                const reviewEffort = document.getElementById('reviewEffortScore');
                const reviewCreativity = document.getElementById('reviewCreativityScore');
                const reviewQuality = document.getElementById('reviewQualityScore');
                const reviewSafety = document.getElementById('reviewSafetyScore');
                const reviewComment = document.getElementById('reviewComment');
                const reviewTotalScore = document.getElementById('reviewTotalScore');
                const reviewGradeDisplay = document.getElementById('reviewGradeDisplay');

                if (reviewEffort) reviewEffort.value = '';
                if (reviewCreativity) reviewCreativity.value = '';
                if (reviewQuality) reviewQuality.value = '0';
                if (reviewSafety) reviewSafety.value = '0';
                if (reviewComment) reviewComment.value = '';
                if (reviewTotalScore) reviewTotalScore.textContent = '0점';
                if (reviewGradeDisplay) reviewGradeDisplay.textContent = '-';

                // 모달 표시
                console.log('📋 모달 표시 중...');
                const modal = document.getElementById('reviewModal');
                if (modal) {
                    modal.classList.add('show');
                    console.log('✅ 모달이 표시되었습니다.');
                } else {
                    console.error('❌ reviewModal 요소를 찾을 수 없습니다.');
                }

            } catch (error) {
                console.error('❌ 모달 열기 오류:', error);
                showToast('제안서를 불러오는데 실패했습니다: ' + error.message, 'error');
            }
        }

        // 평가 점수 계산
        function calculateReviewScore() {
            const effort = parseInt(document.getElementById('reviewEffortScore').value) || 0;
            const creativity = parseInt(document.getElementById('reviewCreativityScore').value) || 0;
            const quality = parseInt(document.getElementById('reviewQualityScore').value) || 0;
            const safety = parseInt(document.getElementById('reviewSafetyScore').value) || 0;

            // 품질과 안전 중 더 높은 점수 사용 (OR 조건)
            const intangibleEffect = Math.max(quality, safety);

            const total = effort + creativity + intangibleEffect;

            document.getElementById('reviewTotalScore').textContent = total + '점';

            // 등급 계산
            const grade = calculateGrade(total);
            document.getElementById('reviewGradeDisplay').textContent = grade || '-';
        }

        // 등급 계산 함수
        function calculateGrade(score) {
            const gradeRanges = [
                { grade: '특급', min: 91, max: 100 },
                { grade: '1급', min: 81, max: 90 },
                { grade: '2급', min: 71, max: 80 },
                { grade: '3급', min: 61, max: 70 },
                { grade: '4급', min: 56, max: 60 },
                { grade: '5급', min: 51, max: 55 },
                { grade: '6급', min: 45, max: 50 },
                { grade: '7급', min: 41, max: 44 },
                { grade: '8급', min: 31, max: 40 },
                { grade: '9급', min: 21, max: 30 },
                { grade: '10급', min: 0, max: 20 }
            ];

            for (let range of gradeRanges) {
                if (score >= range.min && score <= range.max) {
                    return range.grade;
                }
            }
            return null;
        }

        // 평가 모달 닫기
        function closeReviewModal() {
            document.getElementById('reviewModal').classList.remove('show');
            currentSuggestion = null;
        }

        // 승인 처리
        async function approveSuggestion() {
            const effort = parseInt(document.getElementById('reviewEffortScore').value);
            const creativity = parseInt(document.getElementById('reviewCreativityScore').value);
            const quality = parseInt(document.getElementById('reviewQualityScore').value) || 0;
            const safety = parseInt(document.getElementById('reviewSafetyScore').value) || 0;
            const comment = document.getElementById('reviewComment').value;

            if (!effort || !creativity) {
                showToast('노력도와 창의성은 필수 항목입니다.', 'error');
                return;
            }

            const intangibleEffect = Math.max(quality, safety);
            const totalScore = effort + creativity + intangibleEffect;
            const grade = calculateGrade(totalScore);

            if (!confirm('이 제안서를 승인하시겠습니까?')) return;

            try {
                const suggestionRef = db.collection('suggestions').doc(currentSuggestion.id);
                const suggestionData = currentSuggestion;

                // Get the approval line to find the next approver
                const approvalLineDoc = await db.collection('approvalLines').doc(suggestionData.approvalLineId).get();
                if (!approvalLineDoc.exists) {
                    throw new Error('결재 라인 정보를 찾을 수 없습니다.');
                }
                const approvalLineData = approvalLineDoc.data();
                const approvers = approvalLineData.approvers || []; // Firestore에서 approvers 배열을 직접 사용

                const currentStage = suggestionData.stage || 1;
                const nextApprover = approvers.find(a => a.level === currentStage + 1);

                const newHistoryEntry = {
                    approverId: currentLeader.employeeId,
                    approverName: currentLeader.displayName,
                    status: 'approved',
                    level: currentStage,
                    approvedAt: new Date(),
                    scores: {
                        effort: effort,
                        creativity: creativity,
                        quality: quality,
                        safety: safety,
                        intangibleEffect: intangibleEffect,
                        total: totalScore,
                        grade: grade
                    },
                    comment: comment
                };

                const stageKey = `stage${currentStage}`;
                const updateData = {
                    approvalHistory: firebase.firestore.FieldValue.arrayUnion(newHistoryEntry),
                    [`scores.${stageKey}`]: {
                        effort: effort,
                        creativity: creativity,
                        quality: quality,
                        safety: safety,
                        intangibleEffect: intangibleEffect,
                        total: totalScore,
                        grade: grade,
                        comment: comment,
                        evaluatorId: currentLeader.employeeId,
                        evaluatorName: currentLeader.displayName,
                        evaluatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    totalScore: totalScore,
                    grade: grade,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (nextApprover) {
                    // Move to next stage
                    updateData.currentApproverId = nextApprover.id;
                    updateData.stage = currentStage + 1;
                    showToast('승인 완료! 다음 결재자에게 전달되었습니다.', 'success');
                } else {
                    // Final approval
                    updateData.currentApproverId = null; // No more approvers
                    updateData.status = 'approved';
                    showToast('최종 승인 처리되었습니다!', 'success');
                }

                await suggestionRef.update(updateData);

                // 알림 생성
                await db.collection('notifications').add({
                    userId: suggestionData.userId,
                    title: '제안서 승인',
                    message: `${currentLeader.displayName}님이 제안서를 승인했습니다.`,
                    type: 'evaluation',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                closeReviewModal();
                loadAllData(); // Reload all data to reflect changes

            } catch (error) {
                console.error('승인 처리 오류:', error);
                showToast('처리 중 오류가 발생했습니다: ' + error.message, 'error');
            }
        }

        // 반려 처리
        async function rejectSuggestion() {
            const comment = document.getElementById('reviewComment').value;

            if (!comment) {
                showToast('반려 사유를 반드시 입력해주세요.', 'error');
                return;
            }

            if (!confirm('이 제안서를 반려하시겠습니까?')) return;

            try {
                const suggestionRef = db.collection('suggestions').doc(currentSuggestion.id);
                const suggestionData = currentSuggestion;

                const newHistoryEntry = {
                    approverId: currentLeader.employeeId,
                    approverName: currentLeader.displayName,
                    status: 'rejected',
                    level: suggestionData.stage || 1,
                    score: 0,  // 반려 시 점수는 0
                    comment: comment,
                    approvedAt: new Date()
                };

                await suggestionRef.update({
                    status: 'rejected',
                    currentApproverId: null,
                    approvalHistory: firebase.firestore.FieldValue.arrayUnion(newHistoryEntry),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 알림 생성
                await db.collection('notifications').add({
                    userId: suggestionData.userId,
                    title: '제안서 반려',
                    message: `${currentLeader.displayName}님이 제안서를 반려했습니다. 사유: ${comment}`,
                    type: 'evaluation',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('제안서를 반려했습니다.', 'success');
                closeReviewModal();
                loadAllData();

            } catch (error) {
                console.error('반려 처리 오류:', error);
                showToast('처리 중 오류가 발생했습니다.', 'error');
            }
        }

        // 수정 요청
        async function requestRevision() {
            const comment = document.getElementById('reviewComment').value;

            if (!comment) {
                showToast('수정 요청 사항을 입력해주세요.', 'error');
                return;
            }

            if (!confirm('수정을 요청하시겠습니까?')) return;

            try {
                const suggestionRef = db.collection('suggestions').doc(currentSuggestion.id);
                const suggestionData = currentSuggestion;

                const newHistoryEntry = {
                    approverId: currentLeader.employeeId,
                    approverName: currentLeader.displayName,
                    status: 'revision_requested',
                    level: suggestionData.stage || 1,
                    comment: comment,
                    approvedAt: new Date()
                };

                await suggestionRef.update({
                    status: 'revision_requested',
                    currentApproverId: suggestionData.userId, // Re-assign to the original proposer
                    approvalHistory: firebase.firestore.FieldValue.arrayUnion(newHistoryEntry),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 알림 생성
                await db.collection('notifications').add({
                    userId: suggestionData.userId,
                    title: '제안서 수정 요청',
                    message: `${currentLeader.displayName}님이 수정을 요청했습니다. 수정 사항: ${comment}`,
                    type: 'evaluation',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('수정을 요청했습니다.', 'success');
                closeReviewModal();
                loadAllData();

            } catch (error) {
                console.error('수정 요청 오류:', error);
                showToast('처리 중 오류가 발생했습니다.', 'error');
            }
        }

        // 제안서 상세보기 (읽기 전용)
        async function viewSuggestion(suggestionId) {
            console.log('📖 상세보기 호출:', suggestionId);

            try {
                // Firestore에서 제안서 조회
                const doc = await db.collection('suggestions').doc(suggestionId).get();

                if (!doc.exists) {
                    showToast('제안서를 찾을 수 없습니다.', 'error');
                    return;
                }

                const s = { id: doc.id, ...doc.data() };

                const detailHtml = `
                    <div style="padding: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <strong>제안번호:</strong> ${s.suggestionNumber || s.id.substring(0, 8)}<br>
                                <strong>제안자:</strong> ${s.proposer}<br>
                                <strong>제안부서:</strong> ${s.department}<br>
                                <strong>접수일:</strong> ${formatDate(s.createdAt)}
                            </div>
                            <div>
                                <strong>카테고리:</strong> ${s.category || '-'}<br>
                                <strong>우선순위:</strong> ${s.priority || '-'}<br>
                                <strong>실시자:</strong> ${s.implementor || '-'}<br>
                                <strong>실시부서:</strong> ${s.implementDept || '-'}
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 10px;">제안 내용</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">${s.title}</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 10px;">기존실시내용</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${s.currentSituation}</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 10px;">변경(신규)내용</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${s.improvementPlan}</div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h4 style="margin-bottom: 10px;">자체평가</h4>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                <div><strong>노력도:</strong> ${s.scores?.self?.effort || 0}점</div>
                                <div><strong>창의성:</strong> ${s.scores?.self?.creativity || 0}점</div>
                                <div><strong>유무형효과:</strong> ${s.scores?.self?.effect || 0}점</div>
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
                                    <strong>총점:</strong> ${s.scores?.self?.total || 0}점
                                    <strong style="margin-left: 20px;">등급:</strong> ${s.scores?.self?.grade || '-'}
                                </div>
                            </div>
                        </div>

                        ${s.contributors && s.contributors.length > 0 ? `
                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 10px;">참여자 기여도</h4>
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>이름</th>
                                            <th>역할</th>
                                            <th>기여도</th>
                                            <th>부서</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${s.contributors.map(c => `
                                            <tr>
                                                <td>${c.name}</td>
                                                <td>${c.role}</td>
                                                <td>${c.pct}%</td>
                                                <td>${c.department}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : ''}
                    </div>
                `;

                document.getElementById('detailContent').innerHTML = detailHtml;
                document.getElementById('detailModal').classList.add('show');

            } catch (error) {
                console.error('상세보기 오류:', error);
                showToast('제안서를 불러오는데 실패했습니다.', 'error');
            }
        }

        // 상세보기 모달 닫기
        function closeDetailModal() {
            document.getElementById('detailModal').classList.remove('show');
        }

        // 유틸리티 함수
        function formatDate(timestamp) {
            if (!timestamp) return '-';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('ko-KR');
        }

        function showSection(sectionId) {
            // 모든 섹션 숨기기
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // 선택된 섹션 표시
            document.getElementById(sectionId).classList.add('active');

            // 메뉴 활성화
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');

            // 섹션별 데이터 로드
            if (sectionId === 'allSuggestions') {
                loadAllSuggestions();
            }

            // 모바일에서 사이드바 닫기
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        }

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
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

        // 전역 함수 등록 (onclick 이벤트에서 접근 가능하도록)
        console.log('🌐 전역 함수 등록 시작...');
        window.openReviewModal = openReviewModal;
        window.closeReviewModal = closeReviewModal;
        window.calculateReviewScore = calculateReviewScore;
        window.approveSuggestion = approveSuggestion;
        window.rejectSuggestion = rejectSuggestion;
        window.requestRevision = requestRevision;
        window.showSection = showSection;
        window.viewSuggestion = viewSuggestion;
        window.closeDetailModal = closeDetailModal;
        console.log('✅ 전역 함수 등록 완료');
        console.log('확인: window.openReviewModal =', typeof window.openReviewModal);
        console.log('확인: window.viewSuggestion =', typeof window.viewSuggestion);
        console.log('확인: window.closeDetailModal =', typeof window.closeDetailModal);
        window.logout = logout;

        console.log('✅ 모든 전역 함수가 등록되었습니다.');
    