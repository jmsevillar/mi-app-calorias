// =====================================================
// STATS + SUPABASE
// =====================================================

console.log("=================================");
console.log("STATS JS INICIADO");
console.log("=================================");


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://cskahuudfltuqcptgjdv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_EqwZHL3yyP2Ins4IXJtW2Q_CszDqJuT";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// ELEMENTOS HTML
// =====================================================

const tableBody =
    document.getElementById(
        "stats-table-body"
    );

const statsMessage =
    document.getElementById(
        "stats-message"
    );


// =====================================================
// FUNCIÓN PRINCIPAL
// =====================================================

async function loadStats() {

    console.log(
        "1. Comenzando carga de estadísticas..."
    );


    // -------------------------------------------------
    // COMPROBAR TABLA
    // -------------------------------------------------

    if (!tableBody) {

        console.error(
            "ERROR: No existe #stats-table-body"
        );

        return;
    }


    // -------------------------------------------------
    // OBTENER USUARIO
    // -------------------------------------------------

    console.log(
        "2. Comprobando usuario..."
    );

    const {
        data: { user },
        error: userError
    } =
        await supabaseClient.auth.getUser();


    console.log(
        "Usuario:",
        user
    );


    if (userError) {

        console.error(
            "Error obteniendo usuario:",
            userError
        );

        statsMessage.textContent =
            "Error obteniendo el usuario.";

        return;
    }


    if (!user) {

        console.error(
            "NO HAY USUARIO CONECTADO"
        );

        statsMessage.textContent =
            "No hay usuario conectado.";

        return;
    }


    console.log(
        "3. USUARIO CORRECTO:",
        user.id
    );


    // =================================================
    // CALCULAR ÚLTIMOS 30 DÍAS
    // =================================================

    const now = new Date();

    const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29
    );

    const startDateISO =
        startDate.toISOString();


    const endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );

    const endDateISO =
        endDate.toISOString();


    console.log(
        "4. Periodo:",
        startDateISO,
        "→",
        endDateISO
    );


    // =================================================
    // CARGAR COMIDAS
    // =================================================

    console.log(
        "5. Cargando calorías..."
    );


    const {
        data: meals,
        error: mealsError
    } =
        await supabaseClient
            .from("meal_entries")
            .select(
                "calories, eaten_at"
            )
            .eq(
                "user_id",
                user.id
            )
            .gte(
                "eaten_at",
                startDateISO
            )
            .lt(
                "eaten_at",
                endDateISO
            )
            .order(
                "eaten_at",
                {
                    ascending: true
                }
            );


    if (mealsError) {

        console.error(
            "ERROR cargando calorías:",
            mealsError
        );

        statsMessage.textContent =
            "Error cargando las calorías.";

        return;
    }


    console.log(
        "Calorías cargadas:",
        meals
    );


    // =================================================
    // CARGAR PESOS
    // =================================================

    console.log(
        "6. Cargando pesos..."
    );


    const {
        data: weights,
        error: weightsError
    } =
        await supabaseClient
            .from("weight_entries")
            .select(
                "weight_kg, measured_at"
            )
            .eq(
                "user_id",
                user.id
            )
            .gte(
                "measured_at",
                startDateISO
            )
            .lt(
                "measured_at",
                endDateISO
            )
            .order(
                "measured_at",
                {
                    ascending: true
                }
            );


    if (weightsError) {

        console.error(
            "ERROR cargando pesos:",
            weightsError
        );

        statsMessage.textContent =
            "Error cargando los pesos.";

        return;
    }


    console.log(
        "Pesos cargados:",
        weights
    );


    // =================================================
    // CARGAR ENTRENAMIENTOS
    // =================================================

    console.log(
        "7. Cargando entrenamientos..."
    );


    const {
        data: workouts,
        error: workoutsError
    } =
        await supabaseClient
            .from("workout_sessions")
            .select(`
                started_at,
                duration_minutes,
                notes,
                workout_types (
                    name
                ),
                workout_templates (
                    name
                )
            `)
            .eq(
                "user_id",
                user.id
            )
            .gte(
                "started_at",
                startDateISO
            )
            .lt(
                "started_at",
                endDateISO
            )
            .order(
                "started_at",
                {
                    ascending: true
                }
            );


    if (workoutsError) {

        console.error(
            "ERROR cargando entrenamientos:",
            workoutsError
        );

        statsMessage.textContent =
            "Error cargando los entrenamientos.";

        return;
    }


    console.log(
        "Entrenamientos cargados:",
        workouts
    );


    // =================================================
    // CREAR ESTRUCTURA POR DÍAS
    // =================================================

    const days = {};


    // -------------------------------------------------
    // CREAR LOS 30 DÍAS
    // -------------------------------------------------

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - i
            );


        const key =
            getDateKey(date);


        days[key] = {

            date: date,

            calories: 0,

            weight: null,

            workouts: []

        };
    }


    // =================================================
    // AÑADIR CALORÍAS
    // =================================================

    (meals || []).forEach(meal => {

        const date =
            new Date(
                meal.eaten_at
            );

        const key =
            getDateKey(date);


        if (!days[key]) {
            return;
        }


        days[key].calories +=
            Number(
                meal.calories || 0
            );
    });


    // =================================================
    // AÑADIR PESOS
    // =================================================

    (weights || []).forEach(weight => {

        const date =
            new Date(
                weight.measured_at
            );

        const key =
            getDateKey(date);


        if (!days[key]) {
            return;
        }


        // Si hay varios pesos en el mismo día,
        // utilizamos el último.

        days[key].weight =
            Number(
                weight.weight_kg
            );
    });


    // =================================================
    // AÑADIR ENTRENAMIENTOS
    // =================================================

    (workouts || []).forEach(workout => {

        const date =
            new Date(
                workout.started_at
            );

        const key =
            getDateKey(date);


        if (!days[key]) {
            return;
        }


        const typeName =
            workout.workout_types?.name ||
            "Entrenamiento";


        let workoutName;


        // -------------------------------------------------
        // GIMNASIO
        // -------------------------------------------------

        if (
            typeName === "Gimnasio"
        ) {

            workoutName =
                workout.workout_templates?.name ||
                "Gimnasio";

        } else {

            // -------------------------------------------------
            // FÚTBOL / PÁDEL / CORRER
            // -------------------------------------------------

            workoutName =
                typeName;
        }


        days[key].workouts.push(
            workoutName
        );
    });


    // =================================================
    // MOSTRAR TABLA
    // =================================================

    renderStats(days);


    // =================================================
    // MENSAJE
    // =================================================

    statsMessage.textContent =
        "Datos cargados correctamente.";


    console.log(
        "================================="
    );

    console.log(
        "STATS CARGADAS CORRECTAMENTE"
    );

    console.log(
        "================================="
    );
}


// =====================================================
// CREAR CLAVE DE FECHA
// =====================================================

function getDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatDate(date) {

    return date.toLocaleDateString(
        "es-ES",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// =====================================================
// NOMBRE DEL DÍA
// =====================================================

function getDayName(date) {

    return date.toLocaleDateString(
        "es-ES",
        {
            weekday: "long"
        }
    );
}


// =====================================================
// MOSTRAR ESTADÍSTICAS
// =====================================================

function renderStats(days) {

    tableBody.innerHTML = "";


    // Convertir objeto a array

    const rows =
        Object.values(days);


    // Ordenar de más reciente
    // a más antiguo

    rows.sort(
        (a, b) =>
            b.date - a.date
    );


    // -------------------------------------------------
    // BUSCAR EL PESO ANTERIOR
    // -------------------------------------------------

    // Guardamos el último peso conocido
    // mientras recorremos los días de
    // más antiguo a más reciente.

    const rowsOldestFirst =
        [...rows].sort(
            (a, b) =>
                a.date - b.date
        );


    let previousWeight = null;


    rowsOldestFirst.forEach(day => {

        if (
            day.weight === null
        ) {

            return;
        }


        if (
            previousWeight !== null
        ) {

            if (
                day.weight > previousWeight
            ) {

                day.weightColor =
                    "red";

            } else if (
                day.weight < previousWeight
            ) {

                day.weightColor =
                    "green";

            } else {

                day.weightColor =
                    "normal";
            }

        } else {

            // Primer peso disponible:
            // no podemos compararlo.

            day.weightColor =
                "normal";
        }


        previousWeight =
            day.weight;
    });


    // =================================================
    // CREAR UNA FILA POR DÍA
    // =================================================

    rows.forEach(day => {

        const row =
            document.createElement(
                "tr"
            );


        // -------------------------------------------------
        // DÍA
        // -------------------------------------------------

        const dayCell =
            document.createElement(
                "td"
            );

        dayCell.textContent =
            capitalize(
                getDayName(
                    day.date
                )
            );


        // -------------------------------------------------
        // FECHA
        // -------------------------------------------------

        const dateCell =
            document.createElement(
                "td"
            );

        dateCell.textContent =
            formatDate(
                day.date
            );


        // -------------------------------------------------
        // CALORÍAS
        // -------------------------------------------------

        const caloriesCell =
            document.createElement(
                "td"
            );

        if (
            day.calories > 0
        ) {

            caloriesCell.textContent =
                day.calories +
                " kcal";

        } else {

            caloriesCell.textContent =
                "-";
        }


        // -------------------------------------------------
        // PESO
        // -------------------------------------------------

        const weightCell =
            document.createElement(
                "td"
            );


        if (
            day.weight !== null
        ) {

            weightCell.textContent =
                formatWeight(
                    day.weight
                ) +
                " kg";


            // ---------------------------------------------
            // COLOR DEL PESO
            // ---------------------------------------------

            if (
                day.weightColor === "red"
            ) {

                weightCell.style.color =
                    "#e53935";

                weightCell.style.fontWeight =
                    "700";

            } else if (
                day.weightColor === "green"
            ) {

                weightCell.style.color =
                    "#2e7d32";

                weightCell.style.fontWeight =
                    "700";
            }
        } else {

            weightCell.textContent =
                "-";
        }


        // -------------------------------------------------
        // ENTRENAMIENTO
        // -------------------------------------------------

        const workoutCell =
            document.createElement(
                "td"
            );


        if (
            day.workouts.length > 0
        ) {

            workoutCell.textContent =
                day.workouts.join(
                    ", "
                );

        } else {

            workoutCell.textContent =
                "-";
        }


        // -------------------------------------------------
        // AÑADIR CELDAS
        // -------------------------------------------------

        row.appendChild(
            dayCell
        );

        row.appendChild(
            dateCell
        );

        row.appendChild(
            caloriesCell
        );

        row.appendChild(
            weightCell
        );

        row.appendChild(
            workoutCell
        );


        // -------------------------------------------------
        // AÑADIR FILA
        // -------------------------------------------------

        tableBody.appendChild(
            row
        );
    });
}


// =====================================================
// FORMATEAR PESO
// =====================================================

function formatWeight(weight) {

    return Number(
        weight
    ).toLocaleString(
        "es-ES",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


// =====================================================
// MAYÚSCULA INICIAL
// =====================================================

function capitalize(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


// =====================================================
// COMPROBAR SESIÓN
// =====================================================

async function checkSession() {

    console.log(
        "Comprobando sesión..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Error comprobando sesión:",
            error
        );

        statsMessage.textContent =
            "Error comprobando la sesión.";

        return;
    }


    if (
        !data.session
    ) {

        console.error(
            "No hay sesión activa."
        );

        statsMessage.textContent =
            "No hay usuario conectado.";

        return;
    }


    console.log(
        "Sesión encontrada:",
        data.session.user.id
    );


    await loadStats();
}


// =====================================================
// INICIAR
// =====================================================

checkSession();
