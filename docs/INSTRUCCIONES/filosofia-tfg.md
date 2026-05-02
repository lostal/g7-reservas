# Filosofía del proceso TFG: mmasias

Este documento guía a Claude (o cualquier desarrollador) cuando trabaja sobre los archivos de `docs/TFG/`. Está construido exclusivamente a partir de los repos de mmasias y de las instrucciones oficiales del TFG que ya están en `docs/INSTRUCCIONES/`. No refleja el contenido actual del TFG ni asume que ese contenido es correcto. Leer junto a [`filosofia-codigo.md`](./filosofia-codigo.md) antes de tocar cualquier capítulo.

---

## La idea central

> "Se evalúa sobre todo si el proceso de creación fue riguroso, justificado y auditable."

El documento del TFG no es un informe de lo que se hizo. Es la evidencia de que hubo un proceso de ingeniería real: que el escenario generó requisitos, que los requisitos generaron análisis, que el análisis generó diseño, que el diseño generó código. Cada elemento debe poder rastrearse al anterior. Lo que no tiene origen trazable no pertenece al capítulo.

Los tres pilares que sustentan esa trazabilidad:

|                                        |                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Cliente real obligatorio**           | Las decisiones responden a necesidades verificables, no a preferencias del desarrollador.                    |
| **Metodología formal explícita**       | RUP como estándar. Cada disciplina (requisitos, análisis, diseño) produce artefactos concretos y auditables. |
| **Trazabilidad total vía repositorio** | Todo el trabajo reside en el repositorio. El historial de commits expone el proceso como objeto evaluable.   |

---

## Estructura del documento TFG

Mmasias define una cadena directa entre objetivos y capítulos:

| Objetivo específico                             | Capítulo   |
| ----------------------------------------------- | ---------- |
| i. Ejecutar la disciplina de requisitos         | Capítulo 2 |
| ii. Ejecutar la disciplina de análisis y diseño | Capítulo 3 |
| iii. Desarrollar el producto mínimo viable      | Capítulo 4 |

El Capítulo 1 contextualiza y plantea la hipótesis. El Capítulo 5 demuestra que cada objetivo se cumplió — es el opuesto-complementario del 1: mientras el primero presenta, el quinto opina con la misma fundamentación.

El Capítulo 1 se construye por etapas:

1. Contextualización del escenario real
2. Exploración de soluciones existentes (estado del arte)
3. Justificación de por qué ninguna es adecuada para este contexto
4. Propuesta concreta — puente hacia la hipótesis y los objetivos

Antes de trabajar cualquier capítulo de `docs/TFG/`, releer la guía correspondiente en `docs/INSTRUCCIONES/capítulos/`.

---

## Reglas prácticas

### La escritura explica el porqué, no el qué

Los diagramas ya muestran el contenido. La prosa explica por qué el sistema está modelado así: qué necesidad del cliente motivó esa decisión, qué restricción del dominio impone ese comportamiento. Una frase del tipo "el diagrama muestra que X tiene Y" no aporta nada que el propio diagrama no diga.

Toda decisión de diseño aparece con su razón del negocio, no tecnológica. Si la razón es "porque es el estándar" o "porque lo usan todos", la justificación no existe. La razón correcta viene del escenario, de los requisitos, o de los requisitos no funcionales.

### El glosario es el contrato

Los términos que se definen en el glosario del modelo del dominio son los únicos nombres válidos para los conceptos del dominio en todo el documento. No se usan sinónimos, no se mezclan con los nombres del código, no se redefinen en otro capítulo.

### Trazabilidad obligatoria entre capítulos

```
Cap. 1 (escenario)  →  Cap. 2 (requisitos)  →  Cap. 3 (análisis y diseño)  →  Cap. 4 (solución)  →  Cap. 5 (cumplimiento de objetivos)
```

Cada elemento de un capítulo tiene origen en el anterior. Una clase de diseño viene de una clase de análisis. Una clase de análisis viene de un caso de uso y del modelo del dominio. Un caso de uso viene de un actor real con una necesidad real del escenario.

---

## Los diagramas

Todos los diagramas se hacen en **PlantUML**. Las fuentes van en la carpeta `modelosUML/`, los renders exportados en formato SVG junto a ellas. El `.puml` es la fuente de verdad; el `.svg` es derivado. Si divergen, el `.puml` manda.

La referencia en el texto incluye siempre el enlace a la fuente:

```md
![Descripción](ruta/al/diagrama.svg)
<sub>[Código fuente](ruta/al/diagrama.puml)</sub>
```

---

### Capítulo 2: Modelo del dominio

El modelo del dominio construye una abstracción de la realidad **independiente de cualquier decisión de implementación**. Sus artefactos usan el vocabulario del cliente, no el del desarrollador.

#### Diagrama de clases del dominio

Muestra las entidades del negocio, sus atributos relevantes para el dominio y las relaciones entre ellas.

**Qué contiene**: clases del negocio, atributos del dominio, relaciones semánticas (asociación, agregación, composición, herencia) con multiplicidades.

**Qué NO contiene**: `id`, tipos técnicos (`String`, `int`, `LocalDate`), clases de implementación (`Repository`, `Service`, `Controller`), nada que sea una decisión de tecnología o de base de datos. Si una clase no tiene nombre en el vocabulario del cliente, no pertenece aquí.

**Relaciones — cómo elegir**:

- **Asociación** — relación navegable entre objetos del dominio. La más frecuente.
- **Agregación** — el todo puede existir sin las partes y viceversa (rombo vacío).
- **Composición** — las partes no existen sin el todo; destrucción conjunta (rombo relleno). Usar con criterio: implica una afirmación fuerte sobre el ciclo de vida.
- **Herencia** — "es un". Solo cuando la semántica del dominio lo exige, no por conveniencia de reutilización de código.

#### Diagrama de objetos

Instancia concreta del diagrama de clases: muestra objetos reales del escenario con valores de atributos representativos. Sirve para validar que el modelo de clases captura casos reales correctamente. Se usa cuando el diagrama de clases presenta una estructura compleja que puede ser ambigua sin un ejemplo concreto.

#### Diagrama de estados

Muestra el ciclo de vida de una entidad con comportamiento dinámico no trivial.

**Cuándo usarlo**: solo si la entidad tiene tres o más estados con transiciones condicionales. Si tiene dos estados y una transición, se describe en el glosario, no en un diagrama.

**Qué contiene**: estado inicial (●), estados con nombre sustantivo, transiciones etiquetadas con el evento que las dispara, guards en corchetes `[condición]` cuando la misma acción puede producir transiciones distintas según el contexto, estado final (◎) si aplica.

#### Glosario

Tabla de términos del dominio con su definición precisa. No es un glosario técnico. Cada entrada define un concepto desde la perspectiva del negocio. Es la fuente de verdad para la terminología de todo el documento.

#### Requisitos suplementarios

Especifican propiedades del sistema que trascienden la funcionalidad: rendimiento, disponibilidad, seguridad, mantenibilidad, portabilidad, usabilidad. Se expresan como tabla con identificador, categoría y descripción. No son historias de usuario ni casos de uso.

---

### Capítulo 2: Disciplina de requisitos

A partir del modelo del dominio, la disciplina de requisitos delimita lo que el sistema debe hacer.

El proceso es: **encontrar actores y casos de uso → priorizar → detallar → prototipar → estructurar**.

#### Diagrama de contexto

Delimita la frontera del sistema: qué está dentro, qué está fuera, cómo se relacionan. Aparece explícitamente en las rúbricas como artefacto requerido y coherente con el resto de la disciplina de requisitos.

**Error frecuente**: confundirlo con el diagrama de casos de uso. Son distintos. El diagrama de contexto muestra los **límites** del sistema y sus actores externos. El de casos de uso muestra **quién hace qué** dentro de ese límite.

#### Diagrama de casos de uso

Muestra actores, casos de uso y sus relaciones dentro del límite del sistema.

**Nomenclatura de casos de uso**: verbo en infinitivo en camelCase con paréntesis. Desde la perspectiva del actor: `reservarPlaza()`, `aprobarSolicitudAusencia()`. Un CdU nombrado con sustantivo ("Reserva de plaza") está mal nombrado.

**Actores**: personas externas al sistema que interactúan con él, sistemas externos, y las generalizaciones entre actores cuando existen. Un actor que hereda de otro hereda también sus casos de uso.

**Relaciones entre CdU**:

- `<<include>>` — el CdU base siempre invoca al incluido. Es obligatorio, no opcional.
- `<<extend>>` — el CdU extendido puede opcionalmente ejecutarse desde un punto de extensión del base. Si no hay punto de extensión claro, probablemente no es `<<extend>>`.
- Si hay duda, no usar estas relaciones. Describir la variante en el detalle del CdU.

**Priorización**: MoSCoW (Must / Should / Could / Won't). El MVP cubre los Must.

#### Detalle de casos de uso

Para los 3-5 casos de uso más representativos del sistema. El formato puede ser diagrama de actividad, diagrama de estados o texto estructurado según la complejidad del flujo.

**Qué muestra**: flujo principal + flujos alternativos diferenciados. Precondiciones. El actor y el sistema como participantes.

**Qué NO es**: un diagrama de secuencia. El detalle de CdU muestra el flujo lógico (qué pasa). La interacción entre componentes del sistema (quién llama a quién) es responsabilidad de los diagramas de secuencia del capítulo 3.

#### Prototipo de interfaz

Uno por cada caso de uso detallado. Valida que el CdU tiene correspondencia en la interfaz.

**Formato**: baja fidelidad. Sin colores, sin tipografías, sin imágenes reales. Solo estructura de pantalla y flujo de navegación. Es una confirmación de que el caso de uso es implementable, no un diseño visual.

---

### Capítulo 3: Análisis y Diseño

| Análisis                                                                                                       | Diseño                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Refina los requisitos para obtener una descripción más precisa, mantenible, que ayuda a estructurar el sistema | Introduce los requisitos no funcionales y el dominio de la solución; prepara para la implementación y las pruebas |

El objetivo del capítulo:

> "[C]rear una abstracción sin fisuras de la implementación del sistema, de tal modo que la aplicación sea un refinamiento _sencillo_ del diseño mediante la cumplimentación de la _carne_ (código), pero sin cambiar _el esqueleto_ (el diseño)."

#### Diagrama de clases de análisis (modelo RUP)

Paso intermedio entre los casos de uso y las clases de diseño. Se derivan sistemáticamente:

- **Clases Modelo** — del modelo del dominio y la descripción de los casos de uso. Una por entidad del dominio que participa en los CdU.
- **Clases Vista** — una por actor humano primario (representa la ventana principal de interacción) + una vista primitiva por cada clase Modelo + una clase central por cada sistema externo (representa la interfaz de comunicación).
- **Clase Controlador** — exactamente una por caso de uso. Nombrada consistentemente con el CdU. Responsable de coordinar la realización del CdU.

**Qué NO contiene**: atributos, métodos, tipos de dato. Solo nombre, estereotipo y responsabilidades resumidas. Los atributos y métodos llegan en el diseño.

**Error frecuente**: mezclar clases de análisis con clases de diseño en el mismo diagrama. Son pasos distintos con propósitos distintos.

#### Diagrama de clases de diseño

Materializa las clases de análisis añadiendo los detalles de implementación: atributos tipados, métodos con firmas, multiplicidades, tecnologías concretas. Corresponde directamente con el código.

Toda clase de diseño tiene su origen en una clase de análisis. Si aparece una clase que no viene de ninguna parte del análisis, se justifica explícitamente.

La transición de análisis a diseño debe estar **documentada y justificada**: qué clase de análisis dio origen a qué clase de diseño, y por qué el diseño tomó esa forma concreta (razón del dominio o de los requisitos no funcionales).

#### Diagrama de paquetes

Muestra la organización del código en paquetes y las dependencias entre ellos. Las dependencias no forman ciclos. La dirección de las dependencias refleja la arquitectura: los módulos de mayor nivel dependen de los de menor nivel, nunca al revés.

#### Diagrama de despliegue

Muestra los nodos físicos del sistema y cómo se conectan. Requerido explícitamente por las rúbricas junto a los diagramas de clases de diseño y de paquetes. Incluye servidores, procesos, protocolos de comunicación.

**Diferencia con la arquitectura lógica**: el diagrama de despliegue es físico (máquinas, puertos, redes). La arquitectura lógica es de responsabilidades (capas, módulos). Son planos distintos.

#### Diagramas de secuencia (diseño de casos de uso)

Uno por cada caso de uso representativo. Muestra la interacción entre los objetos del sistema durante la ejecución del CdU.

**Qué contiene**: líneas de vida para cada participante, mensajes etiquetados con el nombre real del método, cajas de activación, valores de retorno, bloques `alt`/`opt`/`loop` para condiciones y repeticiones.

**Complemento al detalle de CdU del cap. 2**: el detalle de CdU muestra qué pasa lógicamente; el diagrama de secuencia muestra quién llama a quién en el código. Los dos son necesarios para el mismo caso de uso representativo.

---

## Lo que NO hacer en `docs/TFG/`

| Síntoma                                                               | Señal                                                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Clase en el modelo del dominio con `id` o tipo técnico                | El modelo del dominio no conoce la base de datos — son planos distintos                  |
| CdU nombrado con sustantivo en lugar de verbo                         | La nomenclatura es parte del rigor: `reservarPlaza()`, no "Reserva de plaza"             |
| Detalle de CdU que muestra la interacción entre objetos               | Eso es un diagrama de secuencia — el detalle de CdU muestra el flujo lógico              |
| Clase de diseño sin origen trazable en una clase de análisis          | La trazabilidad es obligatoria — toda clase de diseño viene de alguna parte del análisis |
| Decisión de arquitectura sin justificación de negocio                 | "Porque es el estándar" no es una razón — el escenario o los RNFs sí lo son              |
| Texto que describe el contenido de un diagrama                        | La prosa explica el porqué; el diagrama muestra el qué                                   |
| Diagrama de estados para una entidad con dos estados y una transición | Eso se describe en el glosario, no merece diagrama                                       |
| `<<include>>` y `<<extend>>` invertidos o usados con duda             | Si hay duda, no usar ninguno — describir la variante en el detalle del CdU               |
| Prototipo de interfaz con diseño visual (colores, tipografías)        | Baja fidelidad siempre — la fidelidad visual pertenece al cap. 4                         |
| Diagrama sin fuente `.puml` en el repositorio                         | No es auditable — el SVG puede divergir de la intención sin que nadie lo detecte         |

---

## Lo que SÍ hacer

### Modela la realidad antes de modelar la solución

El modelo del dominio describe el mundo del cliente. El diseño describe la solución técnica. Son documentos distintos, con vocabularios distintos, que no se mezclan.

### Traza todo

Cada artefacto del documento tiene origen en el artefacto anterior de la cadena. Si no se puede responder "¿de dónde viene esto?", no pertenece al capítulo.

### Una fuente de verdad por concepto

El glosario define los términos. El diagrama de clases del dominio establece las entidades. Si un concepto cambia de nombre, cambia en todos los diagramas, en el glosario y en la prosa — no solo en el capítulo donde se detectó.

### Los diagramas en PlantUML, con fuente versionada

Cada diagrama tiene su `.puml` en el repositorio. Si el `.puml` no existe, el diagrama no es auditable y no cumple con las exigencias del proceso.

### Justifica con el dominio

Toda decisión de diseño tiene una razón que viene del escenario, de los actores, de los casos de uso o de los requisitos no funcionales. Si la razón es tecnológica o de preferencia personal, la decisión no está justificada.

---

## Aplicación concreta en este proyecto

1. Los archivos en `docs/TFG/` corresponden a los capítulos del TFG. Antes de modificar cualquiera, releer la guía correspondiente en `docs/INSTRUCCIONES/capítulos/`.

2. **`filosofia-codigo.md` y este archivo son complementarios.** El primero rige cómo se escribe el código. Este rige cómo se modela, se documenta y se argumenta el proceso que condujo a ese código.

3. **Política 2Think**: si Claude genera contenido conceptual para el TFG (estructura de capítulo, decisiones de diseño, contenido de diagramas, glosario), el commit lo refleja. El tutor evalúa si el alumno puede defender lo que el documento dice.

4. El 50% de la evaluación continua recae sobre la trazabilidad del proceso en el repositorio: commits descriptivos, artefactos integrados, historial auditable. Cada commit que toca `docs/TFG/` debe ser atómico y descriptivo.

---

## Referencia

Los repos más relevantes de mmasias para entender esta filosofía:

- `mmasias/TFGs-gII` — directrices oficiales del TFG: estructura de capítulos, rúbricas de evaluación
- `mmasias/idsw2` — Diseño de software: cohesión, acoplamiento, relaciones entre clases, composición vs herencia
- `mmasias/25-26-IdSw1-SdR` — Sesiones de requisitado: formato PlantUML, disciplina de requisitos en práctica real
- `mmasias/mmasias`:
  - `docs/UNEATLANTICO/2Think.md` — política de IA: uso instrumental vs generativo-conceptual
  - `docs/procesoDeCreacion.md` — el proceso de creación como objeto evaluable

Cita que resume lo que se evalúa en los diagramas:

> "¿Cuál sería el formato adecuado del resultado de las reuniones? Diagramas de Clases, Objetos, Actividad, Estados [...] para el Modelo de Dominio; Diagramas de Casos de Uso para Actores y Casos de Uso; Diagramas de Estados o Actividad o Secuencia o textos para el detalle de Casos de Uso [...] con trazabilidad de todo."
