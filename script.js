let workouts = [];
        let currentWorkoutId = null;

      
        function init() {
            loadFromStorage();
            renderWorkouts();
            updateStats();
        }

        function saveToStorage() {
            localStorage.setItem('gymBuddyWorkouts', JSON.stringify(workouts));
        }

        function loadFromStorage() {
            const stored = localStorage.getItem('gymBuddyWorkouts');
            if (stored) {
                workouts = JSON.parse(stored);
            }
        }
        function openWorkoutModal(category) {
            const modal = document.getElementById('workoutModal');
            const categorySelect = document.getElementById('category');
            const modalTitle = document.getElementById('modalTitle');
            
            categorySelect.value = category;
            modalTitle.textContent = `Add ${category.charAt(0).toUpperCase() + category.slice(1)} Workout`;
            modal.classList.add('active');
            
            document.getElementById('exerciseName').focus();
        }

        function closeWorkoutModal() {
            const modal = document.getElementById('workoutModal');
            modal.classList.remove('active');
            document.getElementById('workoutForm').reset();
            hideErrors();
        }

        function openSetModal(workoutId) {
            currentWorkoutId = workoutId;
            const workout = workouts.find(w => w.id === workoutId);
            const modal = document.getElementById('setModal');
            const setModalTitle = document.getElementById('setModalTitle');
            
            setModalTitle.textContent = `Add Set - ${workout.name}`;
            
            if (workout.category === 'strength') {
                document.getElementById('repsGroup').style.display = 'block';
                document.getElementById('weightGroup').style.display = 'block';
                document.getElementById('durationGroup').style.display = 'none';
                document.getElementById('distanceGroup').style.display = 'none';
            } else {
                document.getElementById('repsGroup').style.display = 'none';
                document.getElementById('weightGroup').style.display = 'none';
                document.getElementById('durationGroup').style.display = 'block';
                document.getElementById('distanceGroup').style.display = 'block';
            }
            
            modal.classList.add('active');
        }

        function closeSetModal() {
            const modal = document.getElementById('setModal');
            modal.classList.remove('active');
            document.getElementById('setForm').reset();
            currentWorkoutId = null;
            hideErrors();
        }

        document.getElementById('workoutForm').addEventListener('submit', function(e) {
            e.preventDefault();
            hideErrors();
            
            const name = document.getElementById('exerciseName').value.trim();
            const category = document.getElementById('category').value;
            const numSetsValue = document.getElementById('numSets').value;
            const numSets = parseInt(numSetsValue);
            
            if (!name) {
                showError('nameError');
                return;
            }
            
            if (!numSetsValue || isNaN(numSets) || numSets < 1 || numSets > 10) {
                showError('setsError');
                return;
            }
            
            const workout = {
                id: Date.now(),
                name: name,
                category: category,
                targetSets: numSets,
                sets: [],
                createdAt: new Date().toISOString()
            };
            
            workouts.unshift(workout);
            saveToStorage();
            renderWorkouts();
            updateStats();
            closeWorkoutModal();
        });

        document.getElementById('setForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const workout = workouts.find(w => w.id === currentWorkoutId);
            const setData = {};
            
            if (workout.category === 'strength') {
                const reps = document.getElementById('reps').value;
                const weight = document.getElementById('weight').value;
                
                if (!reps || !weight) {
                    if (!reps) showError('repsError');
                    if (!weight) showError('weightError');
                    return;
                }
                
                setData.reps = parseInt(reps);
                setData.weight = parseFloat(weight);
            } else {
                const duration = document.getElementById('duration').value;
                const distance = document.getElementById('distance').value;
                
                if (!duration || !distance) {
                    if (!duration) showError('durationError');
                    if (!distance) showError('distanceError');
                    return;
                }
                
                setData.duration = parseInt(duration);
                setData.distance = parseFloat(distance);
            }
            
            setData.id = Date.now();
            workout.sets.push(setData);
            
            saveToStorage();
            renderWorkouts();
            updateStats();
            closeSetModal();
        });

     
        function showError(errorId) {
            const errorElement = document.getElementById(errorId);
            errorElement.classList.add('active');
        }

        function hideErrors() {
            const errors = document.querySelectorAll('.error');
            errors.forEach(error => error.classList.remove('active'));
        }

        function renderWorkouts() {
            const container = document.getElementById('workoutsContainer');
            
            if (workouts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No workouts yet!</h3>
                        <p>Start tracking your fitness journey by adding a workout above.</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            workouts.forEach(workout => {
                const card = createWorkoutCard(workout);
                container.appendChild(card);
            });
        }

        function createWorkoutCard(workout) {
            const card = document.createElement('div');
            card.className = 'workout-card';
            
            const categoryClass = workout.category === 'strength' ? 'category-strength' : 'category-cardio';
            const progressFillClass = workout.category === 'strength' ? '' : 'cardio-fill';
            
     
            const targetSets = workout.targetSets || 10;
            const progressPercent = Math.min((workout.sets.length / targetSets) * 100, 100);
            
            let setsHTML = '';
            workout.sets.forEach((set, index) => {
                let setDetails = '';
                if (workout.category === 'strength') {
                    setDetails = `<strong>Set ${index + 1}:</strong> ${set.reps} reps @ ${set.weight} kg`;
                } else {
                    setDetails = `<strong>Set ${index + 1}:</strong> ${set.duration} min • ${set.distance} km`;
                }
                
                setsHTML += `
                    <div class="set-item">
                        <div class="set-details">${setDetails}</div>
                        <button class="delete-set" onclick="deleteSet(${workout.id}, ${set.id})">Delete</button>
                    </div>
                `;
            });
            
            card.innerHTML = `
                <div class="workout-header">
                    <div class="workout-title">${workout.name}</div>
                    <div class="workout-category ${categoryClass}">${workout.category}</div>
                </div>
                <div class="sets-progress">
                    <div class="sets-info">
                        <span>Sets Completed</span>
                        <span class="sets-count">${workout.sets.length} / ${targetSets}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressFillClass}" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="sets-container">
                    ${workout.sets.length > 0 ? setsHTML : '<p style="color: #999;">No sets added yet</p>'}
                </div>
                <div class="workout-actions">
                    <button class="add-set-btn" onclick="openSetModal(${workout.id})">+ Add Set</button>
                    <button class="delete-workout" onclick="deleteWorkout(${workout.id})">Delete</button>
                </div>
            `;
            
            return card;
        }

        function updateStats() {
            const totalWorkouts = workouts.length;
            const strengthCount = workouts.filter(w => w.category === 'strength').length;
            const cardioCount = workouts.filter(w => w.category === 'cardio').length;
            const totalSets = workouts.reduce((sum, w) => sum + w.sets.length, 0);
            
            document.getElementById('totalWorkouts').textContent = totalWorkouts;
            document.getElementById('strengthCount').textContent = strengthCount;
            document.getElementById('cardioCount').textContent = cardioCount;
            document.getElementById('totalSets').textContent = totalSets;
        }

        function deleteWorkout(workoutId) {
            if (confirm('Are you sure you want to delete this workout?')) {
                workouts = workouts.filter(w => w.id !== workoutId);
                saveToStorage();
                renderWorkouts();
                updateStats();
            }
        }

        function deleteSet(workoutId, setId) {
            const workout = workouts.find(w => w.id === workoutId);
            workout.sets = workout.sets.filter(s => s.id !== setId);
            saveToStorage();
            renderWorkouts();
            updateStats();
        }

        function clearAllData() {
            if (confirm('Are you sure you want to clear all workout data? This cannot be undone.')) {
                workouts = [];
                saveToStorage();
                renderWorkouts();
                updateStats();
            }
        }

      
        document.getElementById('workoutModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeWorkoutModal();
            }
        });

        document.getElementById('setModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeSetModal();
            }
        });

    
        init();