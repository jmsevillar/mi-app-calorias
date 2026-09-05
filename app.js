// ==========================================
// CONFIGURACIÓN SUPABASE
// ==========================================

const SUPABASE_URL = "https://cskahuudfltuqcptgjdv.supabase.co";

const SUPABASE_KEY = "sb_publishable_EqwZHL3yyP2Ins4IXJtW2Q_CszDqJuT";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// ELEMENTOS
// ==========================================

const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const logoutButton = document.getElementById("logout-button");

const authMessage = document.getElementById("auth-message");
const userEmail = document.getElementById("user-email");

const consumedCalories = document.getElementById("consumed-calories");
const dailyGoal = document.getElementById("daily-goal");
const remainingCalories = document.getElementById("remaining-calories");
const progressFill = document.getElementById("progress-fill");

const addMealButton = document.getElementById("add-meal-button");
const mealForm = document.getElementById("meal-form");
const mealName = document.getElementById("meal-name");
const mealCalories = document.getElementById("meal-calories");
const saveMealButton = document.getElementById("save-meal-button");
const cancelMealButton = document.getElementById("cancel-meal-button");
const mealMessage = document.getElementById("meal-message");
const mealsList = document.getElementById("meals-list");

const workoutsList =
    document.getElementById("workouts-list");

const createMealTemplateButton =
    document.getElementById("create-meal-template-button");

const mealTemplateForm =
    document.getElementById("meal-template-form");

const templateMealName =
    document.getElementById("template-meal-name");

const templateMealCalories =
    document.getElementById("template-meal-calories");

const saveMealTemplateButton =
    document.getElementById("save-meal-template-button");

const cancelMealTemplateButton =
    document.getElementById("cancel-meal-template-button");

const mealTemplateMessage =
    document.getElementById("meal-template-message");

const mealTemplatesList =
    document.getElementById("meal-templates-list")
	
	
const gymForm =
    document.getElementById("gym-form");

const gymTemplate =
    document.getElementById("gym-template");

const gymExercises =
    document.getElementById("gym-exercises");

const otherWorkoutForm =
    document.getElementById("other-workout-form");

const currentWeight =
    document.getElementById("current-weight");

const editWeightButton =
    document.getElementById("edit-weight-button");


// ==========================================
// TIPOS DE ENTRENAMIENTO
// ==========================================

async function loadWorkoutTypes() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const workoutTypes = [
        "Gimnasio",
        "Fútbol",
        "Pádel",
        "Correr"
    ];

    for (const name of workoutTypes) {

        const { error } =
            await supabaseClient
                .from("workout_types")
                .upsert(
                    {
                        user_id: user.id,
                        name: name
                    },
                    {
                        onConflict: "user_id,name"
                    }
                );

        if (error) {
            console.error(
                "Error creando tipo de entrenamiento:",
                error
            );
        }
    }
}


// =====================================================
// CARGAR RUTINAS DE GIMNASIO
// =====================================================

async function loadGymTemplates() {

    // Obtener el usuario actualmente conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    // Buscar el tipo de entrenamiento "Gimnasio"

    const { data: gymType, error: gymTypeError } =
        await supabaseClient
            .from("workout_types")
            .select("id")
            .eq("user_id", user.id)
            .eq("name", "Gimnasio")
            .single();


    if (gymTypeError) {

        console.error(
            "Error buscando tipo Gimnasio:",
            gymTypeError
        );

        return;
    }


    // Buscar las rutinas de gimnasio del usuario

    const { data: templates, error: templatesError } =
        await supabaseClient
            .from("workout_templates")
            .select("id, name")
            .eq("user_id", user.id)
            .eq("workout_type_id", gymType.id)
            .order("name", { ascending: true });


    if (templatesError) {

        console.error(
            "Error cargando rutinas de gimnasio:",
            templatesError
        );

        return;
    }


    // Limpiar el selector antes de cargar las rutinas

    gymTemplate.innerHTML = `
        <option value="">Selecciona una rutina</option>
    `;


    // Añadir cada rutina al selector

    templates.forEach(template => {

        const option = document.createElement("option");

        option.value = template.id;
        option.textContent = template.name;

        gymTemplate.appendChild(option);
    });
}


// =====================================================
// CARGAR EJERCICIOS DE LA RUTINA DE GIMNASIO
// =====================================================

async function loadGymExercises() {

    // Obtener la rutina seleccionada

    const templateId = gymTemplate.value;

    // Si no hay rutina seleccionada, limpiar y salir

    if (!templateId) {

        gymExercises.innerHTML = "";

        return;
    }


    // Mostrar mensaje mientras cargamos

    gymExercises.innerHTML =
        "<p>Cargando ejercicios...</p>";


    // Buscar los ejercicios de esa rutina

    const { data: exercises, error } =
        await supabaseClient
            .from("workout_exercises")
            .select("*")
            .eq("workout_template_id", templateId)
            .order("exercise_order", {
                ascending: true
            });


    // Comprobar si hubo algún error

    if (error) {

        console.error(
            "Error cargando los ejercicios:",
            error
        );

        gymExercises.innerHTML =
            "<p>Error cargando los ejercicios.</p>";

        return;
    }


    // Si la rutina no tiene ejercicios

    if (!exercises || exercises.length === 0) {

        gymExercises.innerHTML =
            "<p>Esta rutina no tiene ejercicios.</p>";

        return;
    }


    // Limpiar el contenedor

    gymExercises.innerHTML = "";


    // Mostrar cada ejercicio

    exercises.forEach(exercise => {

        const item =
            document.createElement("div");

        item.className =
            "gym-exercise";


        // Texto del objetivo

        const targetText =
            exercise.target_sets &&
            exercise.target_reps_min &&
            exercise.target_reps_max
                ? `${exercise.target_sets} series · ${exercise.target_reps_min}-${exercise.target_reps_max} reps`
                : exercise.target_sets
                    ? `${exercise.target_sets} series`
                    : "Sin objetivo definido";


        // Crear el ejercicio

        item.innerHTML = `
            <strong>
                ${escapeHtml(exercise.exercise_name)}
            </strong>

            <div>
                ${targetText}
            </div>

            <div class="gym-sets">
            </div>
        `;


        const setsContainer =
            item.querySelector(".gym-sets");


        // Número de series indicadas por la rutina

        const numberOfSets =
            exercise.target_sets || 1;


        // =====================================================
        // CREAR FILAS DE SERIES
        // =====================================================

        for (
            let i = 1;
            i <= numberOfSets;
            i++
        ) {

            const setRow =
                document.createElement("div");

            setRow.className =
                "gym-set-row";


            // Guardamos información de la serie

            setRow.dataset.exerciseName =
                exercise.exercise_name;

            setRow.dataset.setNumber =
                i;


            // Crear contenido de la fila

            setRow.innerHTML = `
                <span>
                    Serie ${i}
                </span>

                <input
                    type="number"
                    class="gym-weight"
                    placeholder="kg"
                    min="0"
                    step="0.5"
                >

                <input
                    type="number"
                    class="gym-reps"
                    placeholder="reps"
                    min="0"
                >

<button
    type="button"
    class="save-gym-set-button"
    title="Guardar serie"
    aria-label="Guardar serie"
>
    💾
</button>
            `;


            // Añadir la fila al ejercicio

            setsContainer.appendChild(
                setRow
            );
        }


        // Añadir el ejercicio a la pantalla

        gymExercises.appendChild(
            item
        );
    });


    // =====================================================
    // BOTONES GUARDAR SERIE
    // =====================================================

    document
        .querySelectorAll(".save-gym-set-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    // Buscar la fila de esta serie

                    const setRow =
                        button.closest(
                            ".gym-set-row"
                        );

                    if (!setRow) {
                        return;
                    }


                    // Obtener información de la serie

                    const exerciseName =
                        setRow.dataset.exerciseName;

                    const setNumber =
                        Number(
                            setRow.dataset.setNumber
                        );


                    // Obtener los campos

                    const weightInput =
                        setRow.querySelector(
                            ".gym-weight"
                        );

                    const repsInput =
                        setRow.querySelector(
                            ".gym-reps"
                        );


                    // Obtener valores

                    const weight =
                        weightInput.value;

                    const reps =
                        repsInput.value;


                    // Mostrar temporalmente que se ha pulsado

                    button.textContent = "⏳";


                    console.log(
                        "Serie seleccionada:",
                        {
                            exerciseName,
                            setNumber,
                            weight,
                            reps
                        }
                    );


                    // De momento NO guardamos en Supabase.
                    // Esto lo haremos en el siguiente paso.

                    setTimeout(() => {

                        button.textContent = "✓";

                    }, 500);
                }
            );

        });
}


// =====================================================
// CAMBIAR RUTINA DE GIMNASIO
// =====================================================

gymTemplate.addEventListener("change", async () => {

    // Primero cargamos los ejercicios de la rutina
    await loadGymExercises();

    // Si no hay rutina seleccionada, no hacemos nada
    if (!gymTemplate.value) return;

    // Cargar los datos de la última sesión
    await loadLastGymSession();
});


// =====================================================
// CARGAR DATOS DE LA ÚLTIMA SESIÓN DE GIMNASIO
// =====================================================

async function loadLastGymSession() {

    // Obtener usuario conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    // ID de la rutina seleccionada

    const templateId = gymTemplate.value;

    if (!templateId) return;


    // Buscar la última sesión realizada con esta rutina

    const { data: lastSession, error: sessionError } =
        await supabaseClient
            .from("workout_sessions")
            .select("id")
            .eq("user_id", user.id)
            .eq("workout_template_id", templateId)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();


    if (sessionError) {

        console.error(
            "Error buscando la última sesión:",
            sessionError
        );

        return;
    }


    // Si nunca hemos hecho esta rutina,
    // simplemente dejamos las casillas vacías

    if (!lastSession) {

        console.log(
            "No hay una sesión anterior para esta rutina."
        );

        return;
    }


    // Buscar las series de esa última sesión

    const { data: sets, error: setsError } =
        await supabaseClient
            .from("workout_sets")
            .select("*")
            .eq("workout_session_id", lastSession.id)
            .order("exercise_name", { ascending: true })
            .order("set_number", { ascending: true });


    if (setsError) {

        console.error(
            "Error cargando las series anteriores:",
            setsError
        );

        return;
    }


    // Rellenar los campos de cada ejercicio

    sets.forEach(set => {

        // Buscar todos los ejercicios visibles
        // y encontrar el que corresponde

        const exerciseItems =
            document.querySelectorAll(".gym-exercise");


        exerciseItems.forEach(item => {

            const exerciseTitle =
                item.querySelector("strong");

            if (!exerciseTitle) return;


            // Comprobar que es el ejercicio correcto

            if (
                exerciseTitle.textContent.trim() !==
                set.exercise_name
            ) {
                return;
            }


            // Obtener las filas de series

            const rows =
                item.querySelectorAll(".gym-set-row");


            // La serie 1 corresponde al índice 0,
            // la serie 2 al índice 1, etc.

            const row =
                rows[set.set_number - 1];

            if (!row) return;


            // Rellenar peso

            const weightInput =
                row.querySelector(".gym-weight");

            if (
                weightInput &&
                set.weight_kg !== null
            ) {
                weightInput.value = set.weight_kg;
            }


            // Rellenar repeticiones

            const repsInput =
                row.querySelector(".gym-reps");

            if (
                repsInput &&
                set.repetitions !== null
            ) {
                repsInput.value = set.repetitions;
            }

        });
    });
}

// =====================================================
// CARGAR PESO DE HOY
// =====================================================

async function loadTodayWeight() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const now = new Date();

    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );

    const { data: weight, error } =
        await supabaseClient
            .from("weight_entries")
            .select("weight_kg")
            .eq("user_id", user.id)
            .gte(
                "measured_at",
                startOfDay.toISOString()
            )
            .lt(
                "measured_at",
                startOfTomorrow.toISOString()
            )
            .order("measured_at", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();

    if (error) {

        console.error(
            "Error cargando el peso de hoy:",
            error
        );

        return;
    }

    if (weight) {

        currentWeight.textContent =
            Number(weight.weight_kg)
                .toLocaleString("es-ES", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                });

    } else {

        currentWeight.textContent = "0";
    }
}

// =====================================================
// EDITAR PESO
// =====================================================

editWeightButton.addEventListener("click", async () => {

    const currentValue =
        currentWeight.textContent.trim();

    const newWeight =
        prompt(
            "Introduce tu peso en kg:",
            currentValue === "0" ? "" : currentValue.replace(",", ".")
        );

    if (newWeight === null) {
        return;
    }

    const weightValue =
        Number(newWeight.replace(",", "."));

    if (!weightValue || weightValue <= 0) {

        alert("Introduce un peso válido.");

        return;
    }

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        alert("No hay ningún usuario conectado.");

        return;
    }

    const { error } =
        await supabaseClient
            .from("weight_entries")
            .insert({
                user_id: user.id,
                weight_kg: weightValue,
                measured_at: new Date().toISOString()
            });

    if (error) {

        console.error(
            "Error guardando el peso:",
            error
        );

        alert("No se pudo guardar el peso.");

        return;
    }

    await loadTodayWeight();
});



// ==========================================
// MOSTRAR / OCULTAR PANTALLAS
// ==========================================

function showLogin() {
    loginScreen.hidden = false;
    appScreen.hidden = true;
}

async function showApp(user) {
    loginScreen.hidden = true;
    appScreen.hidden = false;

	updateCurrentDate();
	
    userEmail.textContent = user.email;

    await loadProfile();
    await loadTodayMeals();
	await loadMealTemplates();
	await loadWorkoutTypes();
	await loadTodayWorkouts();
	await loadTodayWeight();
	
}


// ==========================================
// REGISTRO
// ==========================================

registerButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Introduce email y contraseña.";
        return;
    }

    authMessage.textContent = "Creando cuenta...";

    const { data, error } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    if (data.user) {

        if (data.session) {
            authMessage.textContent = "";
            await showApp(data.user);
        } else {
            authMessage.textContent =
                "Cuenta creada. Revisa tu email para confirmar la cuenta.";
        }
    }
});


// ==========================================
// LOGIN
// ==========================================

loginButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        authMessage.textContent = "Introduce email y contraseña.";
        return;
    }

    authMessage.textContent = "Iniciando sesión...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        authMessage.textContent = error.message;
        return;
    }

    authMessage.textContent = "";

    await showApp(data.user);
});


// ==========================================
// CERRAR SESIÓN
// ==========================================

logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    showLogin();
});


// ==========================================
// PERFIL / OBJETIVO DE CALORÍAS
// ==========================================

async function loadProfile() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("daily_calorie_goal")
            .eq("id", user.id)
            .single();

    if (error) {
        console.error("Error cargando perfil:", error);
        return;
    }

    const goal = data.daily_calorie_goal || 2000;

    dailyGoal.textContent = goal;
}


// ==========================================
// ELEMENTOS DE ENTRENAMIENTO
// ==========================================

const addWorkoutButton =
    document.getElementById("add-workout-button");

const workoutForm =
    document.getElementById("workout-form");

const workoutType =
    document.getElementById("workout-type");

const workoutDuration =
    document.getElementById("workout-duration");

const workoutNotes =
    document.getElementById("workout-notes");

const saveWorkoutButton =
    document.getElementById("save-workout-button");

const cancelWorkoutButton =
    document.getElementById("cancel-workout-button");

const workoutMessage =
    document.getElementById("workout-message");



// ==========================================
// ABRIR FORMULARIO DE ENTRENAMIENTO
// ==========================================

addWorkoutButton.addEventListener("click", () => {

    workoutForm.hidden = false;

    workoutType.focus();
});

// ==========================================
// CAMBIAR FORMULARIO SEGÚN EL TIPO DE ENTRENAMIENTO
// ==========================================

workoutType.addEventListener("change", () => {

    if (workoutType.value === "Gimnasio") {

        // Mostrar formulario específico del gimnasio
        gymForm.hidden = false;

        // Ocultar duración y notas de otros entrenamientos
        otherWorkoutForm.hidden = true;

        // Cargar las rutinas de gimnasio
        loadGymTemplates();

    } else {

        // Ocultar formulario de gimnasio
        gymForm.hidden = true;

        // Mostrar duración y notas
        otherWorkoutForm.hidden = false;

        // Limpiar selección y ejercicios del gimnasio
        gymTemplate.value = "";
        gymExercises.innerHTML = "";
    }
});


// ==========================================
// CANCELAR FORMULARIO DE ENTRENAMIENTO
// ==========================================

cancelWorkoutButton.addEventListener("click", () => {

    workoutForm.hidden = true;

    workoutType.value = "";
    workoutDuration.value = "";
    workoutNotes.value = "";
    workoutMessage.textContent = "";
});



// =====================================================
// GUARDAR ENTRENAMIENTO
// =====================================================

saveWorkoutButton.addEventListener("click", async () => {

    const typeName = workoutType.value;
    const duration = Number(workoutDuration.value);
    const notes = workoutNotes.value.trim();

    // Comprobar si estamos editando un entrenamiento existente

    const editingId =
        workoutForm.dataset.editingId || null;

    // Comprobar que hay un tipo seleccionado

    if (!typeName) {

        workoutMessage.textContent =
            "Selecciona un tipo de entrenamiento.";

        return;
    }

    // Obtener usuario conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        workoutMessage.textContent =
            "No hay ningún usuario conectado.";

        return;
    }

    // Buscar el tipo de entrenamiento

    const { data: workoutTypeData, error: typeError } =
        await supabaseClient
            .from("workout_types")
            .select("id")
            .eq("user_id", user.id)
            .eq("name", typeName)
            .single();

    if (typeError) {

        console.error(typeError);

        workoutMessage.textContent =
            "No se pudo encontrar el tipo de entrenamiento.";

        return;
    }


    // =====================================================
    // GIMNASIO
    // =====================================================

    if (typeName === "Gimnasio") {

        const templateId = gymTemplate.value;

        // Comprobar que hay una rutina seleccionada

        if (!templateId) {

            workoutMessage.textContent =
                "Selecciona una rutina de gimnasio.";

            return;
        }

        workoutMessage.textContent =
            "Guardando entrenamiento...";


        // -------------------------------------------------
        // CREAR O ACTUALIZAR LA SESIÓN
        // -------------------------------------------------

        let sessionId = editingId;


        if (editingId) {

            // Estamos editando una sesión existente

            const { error: updateError } =
                await supabaseClient
                    .from("workout_sessions")
                    .update({
                        workout_type_id: workoutTypeData.id,
                        workout_template_id: Number(templateId),
                        notes: notes || null
                    })
                    .eq("id", editingId)
                    .eq("user_id", user.id);

            if (updateError) {

                console.error(
                    "Error actualizando entrenamiento:",
                    updateError
                );

                workoutMessage.textContent =
                    "Error al actualizar el entrenamiento.";

                return;
            }

        } else {

            // Estamos creando una sesión nueva

            const { data: session, error: sessionError } =
                await supabaseClient
                    .from("workout_sessions")
                    .insert({
                        user_id: user.id,
                        workout_type_id: workoutTypeData.id,
                        workout_template_id: Number(templateId),
                        started_at: new Date().toISOString(),
                        notes: notes || null
                    })
                    .select("id")
                    .single();

            if (sessionError) {

                console.error(
                    "Error guardando sesión:",
                    sessionError
                );

                workoutMessage.textContent =
                    "Error al guardar el entrenamiento.";

                return;
            }

            sessionId = session.id;
        }


        // -------------------------------------------------
        // ELIMINAR LAS SERIES ANTERIORES
        // -------------------------------------------------

        // Si estamos editando, primero eliminamos las
        // series anteriores para guardar la versión actual.

        if (editingId) {

            const { error: deleteSetsError } =
                await supabaseClient
                    .from("workout_sets")
                    .delete()
                    .eq("workout_session_id", sessionId);

            if (deleteSetsError) {

                console.error(
                    "Error eliminando series anteriores:",
                    deleteSetsError
                );

                workoutMessage.textContent =
                    "Error actualizando las series.";

                return;
            }
        }


        // -------------------------------------------------
        // PREPARAR LAS SERIES
        // -------------------------------------------------

        const exerciseItems =
            document.querySelectorAll(".gym-exercise");

        const setsToSave = [];


        exerciseItems.forEach(item => {

            const exerciseTitle =
                item.querySelector("strong");

            if (!exerciseTitle) return;

            const exerciseName =
                exerciseTitle.textContent.trim();


            const rows =
                item.querySelectorAll(".gym-set-row");


            rows.forEach((row, index) => {

                const weightInput =
                    row.querySelector(".gym-weight");

                const repsInput =
                    row.querySelector(".gym-reps");


                const weightValue =
                    weightInput.value.trim();

                const repsValue =
                    repsInput.value.trim();


                // Una serie completamente vacía no se guarda

                if (!weightValue && !repsValue) {
                    return;
                }


                setsToSave.push({

                    workout_session_id: sessionId,

                    exercise_name: exerciseName,

                    set_number: index + 1,

                    weight_kg:
                        weightValue
                            ? Number(weightValue)
                            : null,

                    repetitions:
                        repsValue
                            ? Number(repsValue)
                            : null
                });
            });
        });


        // -------------------------------------------------
        // GUARDAR LAS SERIES
        // -------------------------------------------------

        if (setsToSave.length > 0) {

            const { error: setsError } =
                await supabaseClient
                    .from("workout_sets")
                    .insert(setsToSave);


            if (setsError) {

                console.error(
                    "Error guardando series:",
                    setsError
                );

                workoutMessage.textContent =
                    "El entrenamiento se guardó, pero hubo un error con las series.";

                return;
            }
        }


        // -------------------------------------------------
        // LIMPIAR FORMULARIO
        // -------------------------------------------------

        workoutMessage.textContent =
            editingId
                ? "Entrenamiento actualizado."
                : "Entrenamiento guardado.";


        workoutForm.dataset.editingId = "";

        workoutType.value = "";

        workoutDuration.value = "";
        workoutNotes.value = "";

        gymForm.hidden = true;
        otherWorkoutForm.hidden = false;

        gymTemplate.value = "";
        gymExercises.innerHTML = "";


        // Actualizar la lista

        await loadTodayWorkouts();


        // Cerrar formulario

        setTimeout(() => {

            workoutForm.hidden = true;

            workoutMessage.textContent = "";

        }, 700);


        return;
    }


    // =====================================================
    // OTROS ENTRENAMIENTOS
    // =====================================================

    if (!duration || duration <= 0) {

        workoutMessage.textContent =
            "Introduce una duración válida.";

        return;
    }


    workoutMessage.textContent =
        "Guardando entrenamiento...";


    // -------------------------------------------------
    // CREAR O ACTUALIZAR ENTRENAMIENTO
    // -------------------------------------------------

    if (editingId) {

        // Actualizar fútbol, pádel, correr, etc.

        const { error: updateError } =
            await supabaseClient
                .from("workout_sessions")
                .update({
                    workout_type_id: workoutTypeData.id,
                    duration_minutes: duration,
                    notes: notes || null
                })
                .eq("id", editingId)
                .eq("user_id", user.id);


        if (updateError) {

            console.error(updateError);

            workoutMessage.textContent =
                "Error al actualizar: " +
                updateError.message;

            return;
        }

    } else {

        // Crear un entrenamiento nuevo

        const { error } =
            await supabaseClient
                .from("workout_sessions")
                .insert({
                    user_id: user.id,
                    workout_type_id: workoutTypeData.id,
                    started_at: new Date().toISOString(),
                    duration_minutes: duration,
                    notes: notes || null
                });


        if (error) {

            console.error(error);

            workoutMessage.textContent =
                "Error al guardar: " +
                error.message;

            return;
        }
    }


    // -------------------------------------------------
    // LIMPIAR FORMULARIO
    // -------------------------------------------------

    workoutMessage.textContent =
        editingId
            ? "Entrenamiento actualizado."
            : "Entrenamiento guardado.";


    workoutForm.dataset.editingId = "";

    workoutType.value = "";

    workoutDuration.value = "";
    workoutNotes.value = "";

    gymForm.hidden = true;
    otherWorkoutForm.hidden = false;

    gymTemplate.value = "";
    gymExercises.innerHTML = "";


    // Actualizar la lista

    await loadTodayWorkouts();


    // Cerrar formulario

    setTimeout(() => {

        workoutForm.hidden = true;

        workoutMessage.textContent = "";

    }, 700);
});



// ==========================================
// ABRIR FORMULARIO DE COMIDA
// ==========================================

addMealButton.addEventListener("click", () => {

    mealForm.hidden = false;

    mealName.focus();
});


// ==========================================
// CANCELAR FORMULARIO
// ==========================================

cancelMealButton.addEventListener("click", () => {

    mealForm.hidden = true;

    mealName.value = "";
    mealCalories.value = "";
    mealMessage.textContent = "";
});


// ==========================================
// GUARDAR COMIDA
// ==========================================

saveMealButton.addEventListener("click", async () => {

    const name = mealName.value.trim();
    const calories = Number(mealCalories.value);

    if (!name) {
        mealMessage.textContent = "Escribe el nombre de la comida.";
        return;
    }

    if (!calories || calories < 0) {
        mealMessage.textContent = "Introduce unas calorías válidas.";
        return;
    }

    mealMessage.textContent = "Guardando...";

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        mealMessage.textContent = "No hay ningún usuario conectado.";
        return;
    }

    const { error } =
        await supabaseClient
            .from("meal_entries")
            .insert({
                user_id: user.id,
                calories: calories,
                notes: name
            });

    if (error) {
        console.error(error);
        mealMessage.textContent =
            "Error al guardar: " + error.message;
        return;
    }

    mealMessage.textContent = "Comida guardada.";

    mealName.value = "";
    mealCalories.value = "";

    await loadTodayMeals();

    setTimeout(() => {
        mealForm.hidden = true;
        mealMessage.textContent = "";
    }, 700);
});



// =====================================================
// CONTROLAR CAMBIO DE DÍA
// =====================================================

let currentAppDate =
    new Date().toDateString();

function checkForNewDay() {

    const today =
        new Date().toDateString();

    // Si la fecha no ha cambiado, no hacemos nada

    if (today === currentAppDate) {
        return;
    }

    // Guardar la nueva fecha

    currentAppDate = today;

    // Recargar los datos del nuevo día

    loadTodayMeals();
    loadTodayWorkouts();
}

// =====================================================
// COMPROBAR CAMBIO DE DÍA AUTOMÁTICAMENTE
// =====================================================

setInterval(() => {

    checkForNewDay();

}, 300000);


// Comprobar también al volver a la aplicación

document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
        checkForNewDay();
    }

});







// =====================================================
// CARGAR ENTRENAMIENTOS DE HOY
// =====================================================

async function loadTodayWorkouts() {

    // Obtener el usuario actualmente conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    // -------------------------------------------------
    // CALCULAR EL INICIO Y FINAL DEL DÍA
    // -------------------------------------------------

    const now = new Date();

    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );


    // -------------------------------------------------
    // CARGAR ENTRENAMIENTOS
    // -------------------------------------------------

    // Además del tipo de entrenamiento,
    // ahora cargamos también la rutina.
    //
    // Esto permite saber si un gimnasio fue:
    // GYM A
    // GYM B

    const { data, error } =
        await supabaseClient
            .from("workout_sessions")
            .select(`
                *,
                workout_types (
                    name
                ),
                workout_templates (
                    name
                )
            `)
            .eq("user_id", user.id)
            .gte(
                "started_at",
                startOfDay.toISOString()
            )
            .lt(
                "started_at",
                startOfTomorrow.toISOString()
            )
            .order("started_at", {
                ascending: true
            });


    // -------------------------------------------------
    // COMPROBAR ERRORES
    // -------------------------------------------------

    if (error) {

        console.error(
            "Error cargando entrenamientos:",
            error
        );

        workoutsList.innerHTML =
            "<p>Error cargando los entrenamientos.</p>";

        return;
    }


    // -------------------------------------------------
    // MOSTRAR ENTRENAMIENTOS
    // -------------------------------------------------

    renderWorkouts(data);
}






// =====================================================
// MOSTRAR ENTRENAMIENTOS
// =====================================================

function renderWorkouts(workouts) {

    if (!workouts || workouts.length === 0) {

        workoutsList.innerHTML =
            "<p>No has añadido entrenamientos todavía.</p>";

        return;
    }

    workoutsList.innerHTML = "";

    workouts.forEach(workout => {

        const item = document.createElement("div");

        item.className = "workout-item";


        // TIPO DE ENTRENAMIENTO

        const typeName =
            workout.workout_types?.name ||
            "Entrenamiento";


        // INFORMACIÓN SECUNDARIA

        let workoutInfo = "";


        // GIMNASIO → mostrar GYM A / GYM B

        if (typeName === "Gimnasio") {

            workoutInfo =
                workout.workout_templates?.name ||
                "Gimnasio";

        } else {

            // OTROS → mostrar duración

            workoutInfo =
                workout.duration_minutes
                    ? `${workout.duration_minutes} min`
                    : "";
        }


        // CREAR HTML DEL ENTRENAMIENTO

        item.innerHTML = `
            <div>

                <strong>
                    ${escapeHtml(
                        typeName === "Gimnasio"
                            ? workoutInfo
                            : typeName
                    )}
                </strong>

                ${
                    typeName === "Gimnasio"
                        ? `<div>Gimnasio</div>`
                        : workoutInfo
                            ? `<div>${escapeHtml(workoutInfo)}</div>`
                            : ""
                }

                ${
                    workout.notes
                        ? `<div>${escapeHtml(workout.notes)}</div>`
                        : ""
                }

            </div>


            <div class="workout-actions">

                <button
                    class="edit-workout-button"
                    data-id="${workout.id}"
                    title="Editar entrenamiento"
                    aria-label="Editar entrenamiento"
                >
                    ✏️
                </button>

                <button
                    class="delete-workout-button"
                    data-id="${workout.id}"
                    title="Eliminar entrenamiento"
                    aria-label="Eliminar entrenamiento"
                >
                    ×
                </button>

            </div>
        `;


        // Añadir entrenamiento a la lista

        workoutsList.appendChild(item);
    });


    // BOTÓN EDITAR

    document
        .querySelectorAll(".edit-workout-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editWorkout(button.dataset.id)
            );

        });


    // BOTÓN ELIMINAR

    document
        .querySelectorAll(".delete-workout-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteWorkout(button.dataset.id)
            );

        });
}



// =====================================================
// EDITAR ENTRENAMIENTO
// =====================================================

async function editWorkout(workoutId) {

    // Obtener el usuario conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    // Buscar el entrenamiento que queremos editar

    const { data: workout, error } =
        await supabaseClient
            .from("workout_sessions")
            .select(`
                *,
                workout_types (
                    name
                ),
                workout_templates (
                    id,
                    name
                )
            `)
            .eq("id", workoutId)
            .eq("user_id", user.id)
            .single();

    if (error) {

        console.error(
            "Error cargando entrenamiento:",
            error
        );

        alert("No se pudo cargar el entrenamiento.");

        return;
    }

    // Abrir el formulario

    workoutForm.hidden = false;

    // Seleccionar el tipo

    workoutType.value =
        workout.workout_types?.name || "";

    // Si es gimnasio, cargar la rutina y sus series

    if (workout.workout_types?.name === "Gimnasio") {

        gymForm.hidden = false;
        otherWorkoutForm.hidden = true;

        await loadGymTemplates();

        gymTemplate.value =
            workout.workout_template_id || "";

        await loadGymExercises();

        await loadGymSessionSets(workout.id);

    } else {

        // Para fútbol, pádel, correr, etc.

        gymForm.hidden = true;
        otherWorkoutForm.hidden = false;

        workoutDuration.value =
            workout.duration_minutes || "";

        workoutNotes.value =
            workout.notes || "";
    }

    // Guardamos temporalmente el ID que estamos editando

    workoutForm.dataset.editingId =
        workout.id;

    workoutMessage.textContent =
        "Editando entrenamiento...";
}


// =====================================================
// CARGAR SERIES DE UN ENTRENAMIENTO
// =====================================================

async function loadGymSessionSets(sessionId) {

    // Buscar las series guardadas de esta sesión

    const { data: sets, error } =
        await supabaseClient
            .from("workout_sets")
            .select("*")
            .eq("workout_session_id", sessionId)
            .order("exercise_name", { ascending: true })
            .order("set_number", { ascending: true });

    if (error) {

        console.error(
            "Error cargando las series:",
            error
        );

        return;
    }

    // Si no hay series guardadas, no hay nada que rellenar

    if (!sets || sets.length === 0) {
        return;
    }

    // Recorrer las series guardadas

    sets.forEach(set => {

        // Buscar el ejercicio correspondiente

        const exerciseItems =
            document.querySelectorAll(".gym-exercise");

        exerciseItems.forEach(item => {

            const exerciseTitle =
                item.querySelector("strong");

            if (!exerciseTitle) return;

            const exerciseName =
                exerciseTitle.textContent.trim();

            // Comprobar que es el ejercicio correcto

            if (exerciseName !== set.exercise_name) {
                return;
            }

            // Buscar las filas de series

            const rows =
                item.querySelectorAll(".gym-set-row");

            const row =
                rows[set.set_number - 1];

            if (!row) return;

            // Rellenar el peso

            const weightInput =
                row.querySelector(".gym-weight");

            if (
                weightInput &&
                set.weight_kg !== null
            ) {
                weightInput.value =
                    set.weight_kg;
            }

            // Rellenar las repeticiones

            const repsInput =
                row.querySelector(".gym-reps");

            if (
                repsInput &&
                set.repetitions !== null
            ) {
                repsInput.value =
                    set.repetitions;
            }
        });
    });
}

// =====================================================
// CARGAR COMIDAS DE HOY Y ÚLTIMOS 7 DÍAS
// =====================================================

async function loadTodayMeals() {

    // Obtener el usuario conectado

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    // =====================================================
    // CALCULAR EL DÍA ACTUAL
    // =====================================================

    const now = new Date();

    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );


    // =====================================================
    // CARGAR COMIDAS DE HOY
    // =====================================================

    const { data: todayMeals, error: todayError } =
        await supabaseClient
            .from("meal_entries")
            .select("*")
            .eq("user_id", user.id)
            .gte(
                "eaten_at",
                startOfDay.toISOString()
            )
            .lt(
                "eaten_at",
                startOfTomorrow.toISOString()
            )
            .order("eaten_at", {
                ascending: true
            });

    if (todayError) {

        console.error(
            "Error cargando comidas de hoy:",
            todayError
        );

        mealsList.innerHTML =
            "<p>Error cargando las comidas.</p>";

        return;
    }


    // Mostrar las comidas de hoy

    renderMeals(todayMeals);


    // =====================================================
    // CALCULAR ÚLTIMOS 7 DÍAS
    // =====================================================

    const startOfSevenDaysAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6
    );


    // Cargar todas las comidas de los últimos 7 días

    const { data: lastSevenDaysMeals, error: weekError } =
        await supabaseClient
            .from("meal_entries")
            .select("calories")
            .eq("user_id", user.id)
            .gte(
                "eaten_at",
                startOfSevenDaysAgo.toISOString()
            )
            .lt(
                "eaten_at",
                startOfTomorrow.toISOString()
            );


    if (weekError) {

        console.error(
            "Error cargando calorías de los últimos 7 días:",
            weekError
        );

        return;
    }


    // Sumar las calorías de los últimos 7 días

    const sevenDayCalories =
        (lastSevenDaysMeals || []).reduce(
            (total, meal) =>
                total + Number(meal.calories || 0),
            0
        );


    // Calcular el objetivo de 7 días

    const dailyGoal =
        Number(
            document.getElementById(
                "daily-goal"
            )?.textContent
        ) || 2000;


    const sevenDayGoal =
        dailyGoal * 7;


    // Guardar los valores para mostrarlos en pantalla

    const weeklyCaloriesElement =
        document.getElementById(
            "weekly-calories"
        );

    if (weeklyCaloriesElement) {

        weeklyCaloriesElement.textContent =
            `${sevenDayCalories} / ${sevenDayGoal} kcal`;
    }
}



// ==========================================
// MOSTRAR COMIDAS
// ==========================================

function renderMeals(meals) {

    if (!meals || meals.length === 0) {

        mealsList.innerHTML =
            "<p>No has añadido comidas todavía.</p>";

        updateCalories(0);

        return;
    }

    let total = 0;

    mealsList.innerHTML = "";

    meals.forEach(meal => {

        total += meal.calories;

        const item = document.createElement("div");

        item.className = "meal-item";

        item.innerHTML = `
            <div>
                <strong>
                    ${escapeHtml(meal.notes || "Comida")}
                </strong>

                <div>
                    ${meal.calories} kcal
                </div>
            </div>

<button
    class="delete-meal-entry-button"
    data-id="${meal.id}"
    title="Eliminar comida"
    aria-label="Eliminar comida"
>
    🗑️
</button>

        `;

        mealsList.appendChild(item);
    });


    document
        .querySelectorAll(".delete-meal-entry-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteMealEntry(button.dataset.id)
            );

        });


    updateCalories(total);
}


// ==========================================
// MIS COMIDAS
// ==========================================

createMealTemplateButton.addEventListener("click", () => {

    mealTemplateForm.hidden = false;

    templateMealName.focus();
});


cancelMealTemplateButton.addEventListener("click", () => {

    mealTemplateForm.hidden = true;

    templateMealName.value = "";
    templateMealCalories.value = "";
    mealTemplateMessage.textContent = "";
});


saveMealTemplateButton.addEventListener("click", async () => {

    const name = templateMealName.value.trim();
    const calories = Number(templateMealCalories.value);

    if (!name) {
        mealTemplateMessage.textContent =
            "Escribe el nombre de la comida.";
        return;
    }

    if (!calories || calories < 0) {
        mealTemplateMessage.textContent =
            "Introduce unas calorías válidas.";
        return;
    }

    mealTemplateMessage.textContent = "Guardando...";

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        mealTemplateMessage.textContent =
            "No hay ningún usuario conectado.";
        return;
    }

    const { error } =
        await supabaseClient
            .from("meal_templates")
            .insert({
                user_id: user.id,
                name: name,
                calories: calories
            });

    if (error) {

        console.error(error);

        mealTemplateMessage.textContent =
            "Error al guardar: " + error.message;

        return;
    }

    templateMealName.value = "";
    templateMealCalories.value = "";

    mealTemplateMessage.textContent =
        "Comida guardada.";

    await loadMealTemplates();

    setTimeout(() => {

        mealTemplateForm.hidden = true;
        mealTemplateMessage.textContent = "";

    }, 700);
});


// ==========================================
// CARGAR MIS COMIDAS
// ==========================================

async function loadMealTemplates() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } =
        await supabaseClient
            .from("meal_templates")
            .select("*")
            .eq("user_id", user.id)
            .order("name", { ascending: true });

    if (error) {

        console.error(
            "Error cargando mis comidas:",
            error
        );

        mealTemplatesList.innerHTML =
            "<p>Error cargando mis comidas.</p>";

        return;
    }

    renderMealTemplates(data);
}


// ==========================================
// MOSTRAR MIS COMIDAS
// ==========================================

function renderMealTemplates(templates) {

    if (!templates || templates.length === 0) {

        mealTemplatesList.innerHTML =
            "<p>No tienes comidas guardadas.</p>";

        return;
    }

    mealTemplatesList.innerHTML = "";

    templates.forEach(template => {

        const item = document.createElement("div");

        item.className = "meal-template-item";

item.innerHTML = `
    <div>
        <strong>
            ${escapeHtml(template.name)}
        </strong>

        <div>
            ${template.calories} kcal
        </div>
    </div>

    <div class="meal-template-actions">

        <button
            class="use-meal-button"
            title="Añadir"
            aria-label="Añadir"
            data-id="${template.id}"
        >
            ➕
        </button>

        <button
            class="edit-meal-button"
            title="Editar"
            aria-label="Editar"
            data-id="${template.id}"
        >
            ✏️
        </button>

        <button
            class="delete-meal-button"
            title="Eliminar"
            aria-label="Eliminar"
            data-id="${template.id}"
        >
            🗑️
        </button>

    </div>
`;


        mealTemplatesList.appendChild(item);
    });


    document
        .querySelectorAll(".use-meal-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => addTemplateMeal(button.dataset.id)
            );

        });
		
	document
    .querySelectorAll(".edit-meal-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => editMealTemplate(button.dataset.id)
        );

    });


	document
		.querySelectorAll(".delete-meal-button")
		.forEach(button => {

        button.addEventListener(
            "click",
            () => deleteMealTemplate(button.dataset.id)
        );

    });

}


// ==========================================
// AÑADIR UNA COMIDA GUARDADA A HOY
// ==========================================

async function addTemplateMeal(templateId) {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    const { data: template, error: templateError } =
        await supabaseClient
            .from("meal_templates")
            .select("*")
            .eq("id", templateId)
            .eq("user_id", user.id)
            .single();

    if (templateError) {

        console.error(templateError);

        alert("No se pudo cargar la comida.");

        return;
    }


    const { error } =
        await supabaseClient
            .from("meal_entries")
            .insert({

                user_id: user.id,

                meal_template_id: template.id,

                calories: template.calories,

                notes: template.name
            });


    if (error) {

        console.error(error);

        alert(
            "Error al añadir la comida: " +
            error.message
        );

        return;
    }


    await loadTodayMeals();
}

// ==========================================
// EDITAR COMIDA GUARDADA
// ==========================================

async function editMealTemplate(templateId) {

    const {
        data: template,
        error
    } = await supabaseClient
        .from("meal_templates")
        .select("*")
        .eq("id", templateId)
        .single();

    if (error) {
        console.error(error);
        alert("No se pudo cargar la comida.");
        return;
    }

    const newName = prompt(
        "Nombre de la comida:",
        template.name
    );

    if (newName === null) return;

    const cleanName = newName.trim();

    if (!cleanName) {
        alert("El nombre no puede estar vacío.");
        return;
    }

    const newCalories = prompt(
        "Calorías:",
        template.calories
    );

    if (newCalories === null) return;

    const calories = Number(newCalories);

    if (!Number.isFinite(calories) || calories < 0) {
        alert("Introduce unas calorías válidas.");
        return;
    }

    const { error: updateError } =
        await supabaseClient
            .from("meal_templates")
            .update({
                name: cleanName,
                calories: calories
            })
            .eq("id", templateId);

    if (updateError) {
        console.error(updateError);
        alert(
            "Error al editar: " +
            updateError.message
        );
        return;
    }

    await loadMealTemplates();
}

// ==========================================
// ELIMINAR COMIDA GUARDADA
// ==========================================

async function deleteMealTemplate(templateId) {

    const confirmed = confirm(
        "¿Seguro que quieres eliminar esta comida de Mis comidas?"
    );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("meal_templates")
            .delete()
            .eq("id", templateId);

    if (error) {
        console.error(error);

        alert(
            "Error al eliminar: " +
            error.message
        );

        return;
    }

    await loadMealTemplates();
}

// ==========================================
// ELIMINAR COMIDA DE HOY
// ==========================================

async function deleteMealEntry(mealId) {

    const confirmed = confirm(
        "¿Seguro que quieres eliminar esta comida de hoy?"
    );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("meal_entries")
            .delete()
            .eq("id", mealId);

    if (error) {

        console.error("Error eliminando comida:", error);

        alert(
            "Error al eliminar: " +
            error.message
        );

        return;
    }

    await loadTodayMeals();
}

// ==========================================
// ELIMINAR ENTRENAMIENTO
// ==========================================

async function deleteWorkout(workoutId) {

    const confirmed = confirm(
        "¿Seguro que quieres eliminar este entrenamiento?"
    );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("workout_sessions")
            .delete()
            .eq("id", workoutId);

    if (error) {

        console.error(
            "Error eliminando entrenamiento:",
            error
        );

        alert(
            "Error al eliminar: " +
            error.message
        );

        return;
    }

    await loadTodayWorkouts();
}


// ==========================================
// ACTUALIZAR CALORÍAS
// ==========================================

function updateCalories(total) {

    const goal =
        Number(dailyGoal.textContent) || 2000;

    consumedCalories.textContent = total;

    const remaining = goal - total;

    if (remaining >= 0) {
        remainingCalories.textContent =
            `Te quedan ${remaining} kcal`;
    } else {
        remainingCalories.textContent =
            `Te has pasado ${Math.abs(remaining)} kcal`;
    }

    let percentage = (total / goal) * 100;

    if (percentage > 100) {
        percentage = 100;
    }

    progressFill.style.width = percentage + "%";
}


// =====================================================
// MOSTRAR FECHA ACTUAL
// =====================================================

function updateCurrentDate() {

    const currentDateElement =
        document.getElementById("current-date");

    if (!currentDateElement) return;

    const now = new Date();

    const dateText =
        now.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    currentDateElement.textContent = dateText;
}




// ==========================================
// SEGURIDAD PARA TEXTO DE COMIDAS
// ==========================================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================================
// COMPROBAR SESIÓN
// ==========================================

async function checkSession() {

    const {
        data,
        error
    } = await supabaseClient.auth.getSession();

    if (error) {

        console.error(error);

        showLogin();

        return;
    }

    if (data.session) {

        await showApp(data.session.user);

    } else {

        showLogin();
    }
}

checkSession();
