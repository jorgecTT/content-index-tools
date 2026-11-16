/* ================================================================
 * GlossaryData.gs  v1.0.0  (Nov 16, 2026)
 * Content Audit Bridge
 *
 * The approved glossary after Jorge's full review (Nov 16, 2026):
 * 449 terms. Used ONCE by applyFinalGlossary() in GlossaryDoc.gs to
 * update the glossary_auto tab and fill the glossary_extra tab.
 * After that, the sheet tabs are the source; this file is only the
 * record of the review. Don't edit terms here: edit them in the
 * Localization Auditor app (Spanish, context) or the glossary_extra
 * tab (app label, variations, do not use, English context).
 *
 * k: product | ui | term | category
 * ================================================================ */

var GLOSSARY_FINAL_REMOVE = ['Pill Pro', 'Pro Tip'];

var GLOSSARY_FINAL = [
{
"k": "product",
"en": "Front Desk",
"es": "Front Desk",
"app": "",
"var": "",
"dont": "Servicio de Recepción, recepción",
"cxEn": "A service that helps handle calls and first contact with leads.",
"cxEs": "Un servicio que ayuda a gestionar las llamadas y los prospectos iniciales."
},
{
"k": "product",
"en": "Pro Rewards",
"es": "Pro Rewards",
"app": "",
"var": "Always in English, also in \"Thumbtack Pro Rewards\" and level names (e.g. \"nivel Platino de Pro Rewards\").",
"dont": "Recompensas Pro, Recompensas para Profesionales",
"cxEn": "The loyalty program that gives pros benefits. It is a product name and is not translated.",
"cxEs": "Programa de lealtad que ofrece beneficios a los profesionales. Es un nombre de producto y no se traduce."
},
{
"k": "product",
"en": "Thumbtack",
"es": "Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Name of the platform that connects pros with customers.",
"cxEs": "Nombre de la plataforma para conectar profesionales con clientes."
},
{
"k": "product",
"en": "Thumbtack Pay",
"es": "Thumbtack Pay",
"app": "",
"var": "",
"dont": "Pago de Thumbtack",
"cxEn": "Payment processing system. It is a product name and is not translated.",
"cxEs": "Sistema de procesamiento de pagos. Es un nombre de producto y no se traduce."
},
{
"k": "product",
"en": "Thumbtack Pro Rewards",
"es": "Thumbtack Pro Rewards",
"app": "",
"var": "",
"dont": "",
"cxEn": "Loyalty and benefits program for Thumbtack pros.",
"cxEs": "Programa de lealtad y beneficios para los profesionales de Thumbtack."
},
{
"k": "ui",
"en": "+ Add new",
"es": "+ Agregar nuevo",
"app": "+ Add new (“+ Agregar nuevo”)",
"var": "",
"dont": "",
"cxEn": "Button label to add more numbers.",
"cxEs": "Etiqueta de botón para añadir números adicionales."
},
{
"k": "ui",
"en": "+ Add service",
"es": "+ Agregar servicio",
"app": "+ Add service (“+ Agregar servicio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a service.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar un servicio."
},
{
"k": "ui",
"en": "+ New Post",
"es": "+ Nueva publicación",
"app": "+ New Post (“+ Nueva publicación”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use the Thumbtack Community.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar la Comunidad de Thumbtack."
},
{
"k": "ui",
"en": "Account Details",
"es": "Detalles de la cuenta",
"app": "Account Details (“Detalles de la cuenta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Account information and licensing",
"es": "Información de la cuenta y licencias",
"app": "Account information and licensing (“Información de la cuenta y licencias”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Account information update",
"es": "Actualización de información de la cuenta",
"app": "Account information update (“Actualización de información de la cuenta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Account Settings",
"es": "Configuración de la cuenta",
"app": "Account Settings (“Configuración de la cuenta”)",
"var": "",
"dont": "",
"cxEn": "Where the user manages personal info, password and notifications.",
"cxEs": "El área donde usted gestiona su información personal, contraseña y notificaciones."
},
{
"k": "ui",
"en": "Action",
"es": "Acción",
"app": "Action (“Acción”)",
"var": "",
"dont": "",
"cxEn": "Zapier step that defines what happens after the trigger.",
"cxEs": "Paso de Zapier que define qué ocurre tras el disparo."
},
{
"k": "ui",
"en": "Activity",
"es": "Actividad",
"app": "Activity (“Actividad”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to request a refund.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar un reembolso."
},
{
"k": "ui",
"en": "Add",
"es": "Agregar",
"app": "Add (“Agregar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Add a card",
"es": "Agregar una tarjeta",
"app": "Add a card (“Agregar una tarjeta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a credit card.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar una tarjeta de crédito."
},
{
"k": "ui",
"en": "Add a new card",
"es": "Agregar una nueva tarjeta",
"app": "Add a new card (“Agregar una nueva tarjeta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a credit card.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar una tarjeta de crédito."
},
{
"k": "ui",
"en": "Add additional insurance",
"es": "Agregar otro seguro",
"app": "Add additional insurance (“Agregar otro seguro”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Add another business profile",
"es": "Agregar otro perfil de negocio",
"app": "Add another business profile (“Agregar otro perfil de negocio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a business profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar un perfil de negocio."
},
{
"k": "ui",
"en": "Add card",
"es": "Agregar tarjeta",
"app": "Add card (“Agregar tarjeta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a credit card.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar una tarjeta de crédito."
},
{
"k": "ui",
"en": "Add from your contacts",
"es": "Agregar desde sus contactos",
"app": "Add from your contacts (“Agregar desde sus contactos”)",
"var": "",
"dont": "",
"cxEn": "Option to import numbers from the device's contacts.",
"cxEs": "Opción para importar números de la agenda del dispositivo."
},
{
"k": "ui",
"en": "Add funds",
"es": "Agregar fondos",
"app": "Add funds (“Agregar fondos”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to preload my balance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Como precargar mi saldo."
},
{
"k": "ui",
"en": "Add item",
"es": "Agregar concepto",
"app": "Add item (“Agregar concepto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Add manually",
"es": "Agregar manualmente",
"app": "Add manually (“Agregar manualmente”)",
"var": "",
"dont": "",
"cxEn": "Option to type in a phone number.",
"cxEs": "Opción para ingresar un número de teléfono por escrito."
},
{
"k": "ui",
"en": "Add new project",
"es": "Agregar nuevo proyecto",
"app": "Add new project (“Agregar nuevo proyecto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my featured projects.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis proyectos destacados."
},
{
"k": "ui",
"en": "Add new service",
"es": "Agregar nuevo servicio",
"app": "Add new service (“Agregar nuevo servicio”)",
"var": "",
"dont": "",
"cxEn": "Action to create a new service on the profile.",
"cxEs": "Acción para crear un servicio nuevo en su perfil."
},
{
"k": "ui",
"en": "Add project",
"es": "Agregar proyecto",
"app": "Add project (“Agregar proyecto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my featured projects.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis proyectos destacados."
},
{
"k": "ui",
"en": "Add rating",
"es": "Agregar calificación",
"app": "Add rating (“Agregar calificación”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Add reviews",
"es": "Agregar reseñas",
"app": "Add reviews (“Agregar reseñas”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Add reviews from Google",
"es": "Agregar reseñas desde Google",
"app": "Add reviews from Google (“Agregar reseñas desde Google”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Agree and continue",
"es": "Aceptar y continuar",
"app": "Agree and continue (“Aceptar y continuar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up direct deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar el depósito directo."
},
{
"k": "ui",
"en": "All my businesses",
"es": "Todos mis negocios",
"app": "All my businesses (“Todos mis negocios”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Apps",
"es": "Aplicaciones",
"app": "Apps (“Aplicaciones”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create a webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear un webhook."
},
{
"k": "ui",
"en": "Apps & Integrations",
"es": "Aplicaciones e integraciones",
"app": "Apps & Integrations (“Aplicaciones e integraciones”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is the Apps tab.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es la pestaña Apps."
},
{
"k": "ui",
"en": "Ask for reviews",
"es": "Solicitar reseñas",
"app": "Ask for reviews (“Solicitar reseñas”)",
"var": "",
"dont": "Pedir reseñas",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Authorization type",
"es": "Tipo de autorización",
"app": "Authorization type (“Tipo de autorización”)",
"var": "",
"dont": "",
"cxEn": "Security setting to validate the connection between tools.",
"cxEs": "Ajuste de seguridad para validar la conexión entre herramientas."
},
{
"k": "ui",
"en": "Available for instant deposit",
"es": "Disponible para depósito instantáneo",
"app": "Available for instant deposit (“Disponible para depósito instantáneo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is instant deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el depósito instantáneo."
},
{
"k": "ui",
"en": "Billing settings",
"es": "Configuración de facturación",
"app": "Billing settings (“Configuración de facturación”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to preload my balance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Como precargar mi saldo."
},
{
"k": "ui",
"en": "Business FAQs",
"es": "Preguntas frecuentes del negocio",
"app": "Business FAQs (“Preguntas frecuentes del negocio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to price my services.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo establecer el precio de mis servicios."
},
{
"k": "ui",
"en": "Business Insurance",
"es": "Seguro comercial",
"app": "Business Insurance (“Seguro comercial”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Business Profile",
"es": "Perfil de negocio",
"app": "Business Profile (“Perfil de negocio”)",
"var": "",
"dont": "",
"cxEn": "The pro's Thumbtack page that customers see.",
"cxEs": "Su página en Thumbtack que ven los clientes."
},
{
"k": "ui",
"en": "Calendar",
"es": "Calendario",
"app": "Calendar (“Calendario”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Calendar year",
"es": "Año calendario",
"app": "Calendar year (“Año calendario”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Can't do it",
"es": "No puedo hacerlo",
"app": "Can't do it (“No puedo hacerlo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Cancel",
"es": "Cancelar",
"app": "Cancel (“Cancelar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Política de trabajos preestablecidos."
},
{
"k": "ui",
"en": "Cancel invoice",
"es": "Cancelar factura",
"app": "Cancel invoice (“Cancelar factura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Change Password",
"es": "Cambiar contraseña",
"app": "Change Password (“Cambiar contraseña”)",
"var": "",
"dont": "",
"cxEn": "The process to update the password for security.",
"cxEs": "El proceso para actualizar su contraseña por seguridad."
},
{
"k": "ui",
"en": "Choose file",
"es": "Elegir archivo",
"app": "Choose file (“Elegir archivo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Choose Trigger Event",
"es": "Elegir evento disparador",
"app": "Choose Trigger Event (“Elegir evento disparador”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Choose type",
"es": "Elegir tipo",
"app": "Choose type (“Elegir tipo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "City",
"es": "Ciudad",
"app": "City (“Ciudad”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Close",
"es": "Cerrar",
"app": "Close (“Cerrar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Close Account",
"es": "Cerrar cuenta",
"app": "Close Account (“Cerrar cuenta”)",
"var": "",
"dont": "",
"cxEn": "Permanently delete the Thumbtack account.",
"cxEs": "Eliminar su cuenta de Thumbtack de forma permanente."
},
{
"k": "ui",
"en": "Closed",
"es": "Cerrado",
"app": "Closed (“Cerrado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Contact Us",
"es": "Contáctenos",
"app": "Contact Us (“Contáctenos”)",
"var": "",
"dont": "Contáctanos",
"cxEn": "UI button or link to contact the support team.",
"cxEs": "Botón o enlace para contactar al equipo de soporte."
},
{
"k": "ui",
"en": "Continue",
"es": "Continuar",
"app": "Continue (“Continuar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Continue with Selected Record",
"es": "Continuar con el registro seleccionado",
"app": "Continue with Selected Record (“Continuar con el registro seleccionado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Convert to invoice",
"es": "Convertir en factura",
"app": "Convert to invoice (“Convertir en factura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Copy",
"es": "Copiar",
"app": "Copy (“Copiar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Copy shareable link",
"es": "Copiar enlace para compartir",
"app": "Copy shareable link (“Copiar enlace para compartir”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "Copy to clipboard",
"es": "Copiar al portapapeles",
"app": "Copy to clipboard (“Copiar al portapapeles”)",
"var": "",
"dont": "",
"cxEn": "Feature to copy the customer's info and paste it somewhere else.",
"cxEs": "Función para copiar la información del cliente y pegarla externamente."
},
{
"k": "ui",
"en": "Create a Zap",
"es": "Crear un Zap",
"app": "Create a Zap (“Crear un Zap”)",
"var": "",
"dont": "",
"cxEn": "Zapier button to start a new automated workflow.",
"cxEs": "Botón en Zapier para iniciar un nuevo flujo automatizado."
},
{
"k": "ui",
"en": "Create estimate or invoice",
"es": "Crear cotización o factura",
"app": "Create estimate or invoice (“Crear cotización o factura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Create quick reply",
"es": "Crear respuesta rápida",
"app": "Create quick reply (“Crear respuesta rápida”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quick replies.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar respuestas rápidas."
},
{
"k": "ui",
"en": "Create webhook",
"es": "Crear webhook",
"app": "Create webhook (“Crear webhook”)",
"var": "",
"dont": "",
"cxEn": "Button to start setting up a new connection.",
"cxEs": "Botón para iniciar la configuración de una nueva conexión."
},
{
"k": "ui",
"en": "Credentials",
"es": "Credenciales",
"app": "Credentials (“Credenciales”)",
"var": "",
"dont": "",
"cxEn": "Account section with verifications and documents.",
"cxEs": "Sección de la cuenta donde se encuentran las verificaciones y documentos."
},
{
"k": "ui",
"en": "Credited",
"es": "Acreditado",
"app": "Credited (“Acreditado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to request a refund.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar un reembolso."
},
{
"k": "ui",
"en": "Customer Name",
"es": "Nombre del cliente",
"app": "Customer Name (“Nombre del cliente”)",
"var": "",
"dont": "",
"cxEn": "Data field that identifies the requesting customer.",
"cxEs": "Campo de datos que identifica al usuario solicitante."
},
{
"k": "ui",
"en": "Customer Phone",
"es": "Teléfono del cliente",
"app": "Customer Phone (“Teléfono del cliente”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Customers travel to me",
"es": "Los clientes vienen a mí",
"app": "Customers travel to me (“Los clientes vienen a mí”)",
"var": "",
"dont": "Los clientes viajan hacia mí",
"cxEn": "Button or label in the app. Used in: How to manage my travel areas.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis áreas de desplazamiento."
},
{
"k": "ui",
"en": "Date range",
"es": "Rango de fechas",
"app": "Date range (“Rango de fechas”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Deactivate Account",
"es": "Desactivar cuenta",
"app": "Deactivate Account (“Desactivar cuenta”)",
"var": "",
"dont": "",
"cxEn": "Pause the account for a while so no leads or charges come in.",
"cxEs": "Pausar su cuenta temporalmente para no recibir prospectos ni cargos."
},
{
"k": "ui",
"en": "Deactivate this service",
"es": "Desactivar este servicio",
"app": "Deactivate this service (“Desactivar este servicio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a service.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar un servicio."
},
{
"k": "ui",
"en": "Decline",
"es": "Rechazar",
"app": "Decline (“Rechazar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los prospectos de Smart Match."
},
{
"k": "ui",
"en": "Define specific business hours",
"es": "Definir horario comercial específico",
"app": "Define specific business hours (“Definir horario comercial específico”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Delete",
"es": "Eliminar",
"app": "Delete (“Eliminar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quote templates.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar plantillas de cotización."
},
{
"k": "ui",
"en": "Delete project",
"es": "Eliminar proyecto",
"app": "Delete project (“Eliminar proyecto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my featured projects.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis proyectos destacados."
},
{
"k": "ui",
"en": "Delete Template",
"es": "Eliminar plantilla",
"app": "Delete Template (“Eliminar plantilla”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quote templates.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar plantillas de cotización."
},
{
"k": "ui",
"en": "Delete webhook",
"es": "Eliminar webhook",
"app": "Delete webhook (“Eliminar webhook”)",
"var": "",
"dont": "",
"cxEn": "Button to permanently remove a data connection.",
"cxEs": "Botón para eliminar permanentemente una conexión de datos."
},
{
"k": "ui",
"en": "Denied",
"es": "Rechazado",
"app": "Denied (“Rechazado”)",
"var": "",
"dont": "",
"cxEn": "Status of a refund request that wasn't approved.",
"cxEs": "Estado de una solicitud de reembolso que no fue aprobada."
},
{
"k": "ui",
"en": "Deposit",
"es": "Depositar",
"app": "Deposit (“Depositar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is instant deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el depósito instantáneo."
},
{
"k": "ui",
"en": "Deposit accounts",
"es": "Cuentas de depósito",
"app": "Deposit accounts (“Cuentas de depósito”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is instant deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el depósito instantáneo."
},
{
"k": "ui",
"en": "Disabled",
"es": "Desactivado",
"app": "Disabled (“Desactivado”)",
"var": "",
"dont": "",
"cxEn": "Status that shows the connection is off.",
"cxEs": "Estado que indica que la conexión está apagada."
},
{
"k": "ui",
"en": "Done",
"es": "Listo",
"app": "Done (“Listo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Download",
"es": "Descargar",
"app": "Download (“Descargar”)",
"var": "",
"dont": "",
"cxEn": "Action or button to save the receipt file to the device.",
"cxEs": "Acción o botón para guardar el archivo del recibo en el dispositivo."
},
{
"k": "ui",
"en": "Download CSV file",
"es": "Descargar archivo CSV",
"app": "Download CSV file (“Descargar archivo CSV”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Download lead details",
"es": "Descargar detalles de prospectos",
"app": "Download lead details (“Descargar detalles de prospectos”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Download the pro app now",
"es": "Descargar la aplicación para profesionales ahora",
"app": "Download the pro app now (“Descargar la aplicación para profesionales ahora”)",
"var": "",
"dont": "",
"cxEn": "Button label to start downloading the mobile app.",
"cxEs": "Etiqueta de botón para iniciar la descarga de la herramienta móvil."
},
{
"k": "ui",
"en": "Duplicate",
"es": "Duplicar",
"app": "Duplicate (“Duplicar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Edit",
"es": "Editar",
"app": "Edit (“Editar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quote templates.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar plantillas de cotización."
},
{
"k": "ui",
"en": "Edit availability settings",
"es": "Editar configuración de disponibilidad",
"app": "Edit availability settings (“Editar configuración de disponibilidad”)",
"var": "",
"dont": "Editar disponibilidad",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Edit password",
"es": "Editar contraseña",
"app": "Edit password (“Editar contraseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to update my password.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo actualizar mi contraseña."
},
{
"k": "ui",
"en": "Edit your travel type",
"es": "Editar tipo de desplazamiento",
"app": "Edit your travel type (“Editar tipo de desplazamiento”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my travel areas.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis áreas de desplazamiento."
},
{
"k": "ui",
"en": "Email",
"es": "Correo electrónico",
"app": "Email (“Correo electrónico”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Email address",
"es": "Dirección de correo electrónico",
"app": "Email address (“Dirección de correo electrónico”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Enabled",
"es": "Activado",
"app": "Enabled (“Activado”)",
"var": "",
"dont": "",
"cxEn": "Status that shows the webhook is working.",
"cxEs": "Estado que indica que el webhook está funcionando activamente."
},
{
"k": "ui",
"en": "endpoint URL",
"es": "URL de destino",
"app": "endpoint URL (“URL de destino”)",
"var": "",
"dont": "",
"cxEn": "Web address where lead data is received.",
"cxEs": "Dirección digital donde se reciben los datos de los prospectos."
},
{
"k": "ui",
"en": "Exact match",
"es": "Coincidencia exacta",
"app": "Exact match (“Coincidencia exacta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Failure",
"es": "Error",
"app": "Failure (“Error”)",
"var": "",
"dont": "",
"cxEn": "Status that shows an error happened during delivery.",
"cxEs": "Estado que indica que ocurrió un error en la entrega."
},
{
"k": "ui",
"en": "Feature this project",
"es": "Destacar este proyecto",
"app": "Feature this project (“Destacar este proyecto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my featured projects.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis proyectos destacados."
},
{
"k": "ui",
"en": "Featured Projects",
"es": "Proyectos destacados",
"app": "Featured Projects (“Proyectos destacados”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my featured projects.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis proyectos destacados."
},
{
"k": "ui",
"en": "Folders",
"es": "Carpetas",
"app": "Folders (“Carpetas”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "For you",
"es": "Para usted",
"app": "For you (“Para usted”)",
"var": "",
"dont": "",
"cxEn": "Tab with recommendations and jobs that match the pro's preferences.",
"cxEs": "Pestaña donde ve recomendaciones y trabajos que coinciden con sus preferencias."
},
{
"k": "ui",
"en": "Forgot password?",
"es": "¿Olvidó su contraseña?",
"app": "Forgot password? (“¿Olvidó su contraseña?”)",
"var": "",
"dont": "",
"cxEn": "Help link to get back into the account.",
"cxEs": "Enlace de ayuda para recuperar el acceso a la cuenta."
},
{
"k": "ui",
"en": "Get reviews",
"es": "Obtener reseñas",
"app": "Get reviews (“Obtener reseñas”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Go live now",
"es": "Activar ahora",
"app": "Go live now (“Activar ahora”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to pause leads and hide my business.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo pausar mis prospectos y ocultar mi negocio."
},
{
"k": "ui",
"en": "Great Value",
"es": "Buen precio",
"app": "Great Value (“Buen precio”)",
"var": "",
"dont": "Buen valor",
"cxEn": "Button or label in the app. Used in: What are search results.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los resultados de búsqueda."
},
{
"k": "ui",
"en": "Hide business now",
"es": "Ocultar negocio ahora",
"app": "Hide business now (“Ocultar negocio ahora”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to pause leads and hide my business.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo pausar mis prospectos y ocultar mi negocio."
},
{
"k": "ui",
"en": "Hide my business",
"es": "Ocultar mi negocio",
"app": "Hide my business (“Ocultar mi negocio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to pause leads and hide my business.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo pausar mis prospectos y ocultar mi negocio."
},
{
"k": "ui",
"en": "Hide my business temporarily",
"es": "Ocultar mi negocio temporalmente",
"app": "Hide my business temporarily (“Ocultar mi negocio temporalmente”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to pause leads and hide my business.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo pausar mis prospectos y ocultar mi negocio."
},
{
"k": "ui",
"en": "Home",
"es": "Inicio",
"app": "Home (“Inicio”)",
"var": "Tab in the app: Home (“Inicio”). A house (home improvement, home services): \"hogar\".",
"dont": "Hogar (for the tab)",
"cxEn": "Button or label in the app. Used in: Thumbtack user guidelines.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Pautas para usuarios de Thumbtack."
},
{
"k": "ui",
"en": "Import from Google",
"es": "Importar desde Google",
"app": "Import from Google (“Importar desde Google”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Import from other sites",
"es": "Importar de otros sitios",
"app": "Import from other sites (“Importar de otros sitios”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Import reviews from other sites",
"es": "Importar reseñas de otros sitios",
"app": "Import reviews from other sites (“Importar reseñas de otros sitios”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "In High Demand",
"es": "Muy solicitado",
"app": "In High Demand (“Muy solicitado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What are search results.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los resultados de búsqueda."
},
{
"k": "ui",
"en": "Inbox",
"es": "Bandeja de entrada",
"app": "Inbox (“Bandeja de entrada”)",
"var": "",
"dont": "buzón de entrada",
"cxEn": "Button or label in the app. Used in: How to review a pro.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo dejar una reseña a un profesional."
},
{
"k": "ui",
"en": "Inbox filters",
"es": "Filtros de bandeja de entrada",
"app": "Inbox filters (“Filtros de bandeja de entrada”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "Insights",
"es": "Panel de rendimiento",
"app": "Insights (“Panel de rendimiento”)",
"var": "",
"dont": "",
"cxEn": "Former name of the section now called Performance Dashboard, where the pro sees how their business is doing (views, responses, hires). When the English names the section or tab, use the UI format: Insights (\"Panel de rendimiento\").",
"cxEs": "Nombre anterior de la sección hoy llamada Performance Dashboard, donde el profesional ve el rendimiento de su negocio (vistas, respuestas, contrataciones). Cuando el inglés nombra la sección o pestaña, use el formato de UI: Insights (“Panel de rendimiento”)."
},
{
"k": "ui",
"en": "Integrations",
"es": "Integraciones",
"app": "Integrations (“Integraciones”)",
"var": "",
"dont": "",
"cxEn": "Menu option to manage connections with outside tools.",
"cxEs": "Opción del menú para gestionar conexiones con herramientas externas."
},
{
"k": "ui",
"en": "Invoice",
"es": "Factura",
"app": "Invoice (“Factura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Invoices & estimates",
"es": "Facturas y cotizaciones",
"app": "Invoices & estimates (“Facturas y cotizaciones”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Job done",
"es": "Trabajo terminado",
"app": "Job done (“Trabajo terminado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "Job Preferences",
"es": "Preferencias de trabajo",
"app": "Job Preferences (“Preferencias de trabajo”)",
"var": "",
"dont": "",
"cxEn": "Settings for where, when and what kind of jobs the pro wants.",
"cxEs": "La configuración de dónde, cuándo y qué tipo de trabajos usted quiere."
},
{
"k": "ui",
"en": "Jobs page",
"es": "Trabajos",
"app": "Jobs page (“Trabajos”)",
"var": "",
"dont": "",
"cxEn": "App section where jobs are managed. Write it as: Jobs (\"Trabajos\").",
"cxEs": "Sección de la aplicación donde se gestionan los trabajos. Se escribe: Jobs (“Trabajos”)."
},
{
"k": "ui",
"en": "Lead time",
"es": "Tiempo de aviso",
"app": "Lead time (“Tiempo de aviso”)",
"var": "",
"dont": "tiempo de antelación",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Learn more",
"es": "Más información",
"app": "Learn more (“Más información”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is the Apps tab.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es la pestaña Apps."
},
{
"k": "ui",
"en": "Let's get you enrolled",
"es": "Inscribirse ahora",
"app": "Let's get you enrolled (“Inscribirse ahora”)",
"var": "",
"dont": "",
"cxEn": "Button to start signing a business up for the service.",
"cxEs": "Botón para iniciar el registro de un negocio en el servicio."
},
{
"k": "ui",
"en": "Location",
"es": "Ubicación",
"app": "Location (“Ubicación”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los prospectos de Smart Match."
},
{
"k": "ui",
"en": "Log in",
"es": "Iniciar sesión",
"app": "Log in (“Iniciar sesión”)",
"var": "Button Log in or Sign in: \"Iniciar sesión\". The noun login: \"inicio de sesión\".",
"dont": "",
"cxEn": "Button or action to sign in to the account.",
"cxEs": "Botón o acción para entrar a la cuenta de usuario."
},
{
"k": "ui",
"en": "Login",
"es": "Inicio de sesión",
"app": "Login (“Inicio de sesión”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Manage insurance",
"es": "Administrar seguro",
"app": "Manage insurance (“Administrar seguro”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Manage lead prices",
"es": "Administrar precios de prospectos",
"app": "Manage lead prices (“Administrar precios de prospectos”)",
"var": "",
"dont": "",
"cxEn": "UI label to change lead prices.",
"cxEs": "Etiqueta de UI para cambiar precios de prospectos."
},
{
"k": "ui",
"en": "Manage third-party platform visibility",
"es": "Administrar la visibilidad en plataformas de terceros",
"app": "Manage third-party platform visibility (“Administrar la visibilidad en plataformas de terceros”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is AI Mode in Google Search?.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es Google AI Search."
},
{
"k": "ui",
"en": "Manage webhooks",
"es": "Administrar webhooks",
"app": "Manage webhooks (“Administrar webhooks”)",
"var": "",
"dont": "",
"cxEn": "Dashboard section to edit the automatic connections already set up.",
"cxEs": "Sección del panel para editar las conexiones automáticas configuradas."
},
{
"k": "ui",
"en": "Manage your budget",
"es": "Administrar su presupuesto",
"app": "Manage your budget (“Administrar su presupuesto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to edit my budget.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo editar mi presupuesto."
},
{
"k": "ui",
"en": "Mark as Hired",
"es": "Marcar como contratado",
"app": "Mark as Hired (“Marcar como contratado”)",
"var": "",
"dont": "",
"cxEn": "Action to show a customer chose the pro for the job.",
"cxEs": "La acción de indicar que un cliente lo eligió a usted para el trabajo."
},
{
"k": "ui",
"en": "Mark as paid",
"es": "Marcar como pagada",
"app": "Mark as paid (“Marcar como pagada”)",
"var": "Invoice: \"Marcar como pagada\". If the label refers to a charge or payment: \"Marcar como pagado\".",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Mark as unavailable",
"es": "Marcar como no disponible",
"app": "Mark as unavailable (“Marcar como no disponible”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Mark done",
"es": "Marcar como terminado",
"app": "Mark done (“Marcar como terminado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What are preset jobs.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los trabajos preestablecidos."
},
{
"k": "ui",
"en": "More",
"es": "Más",
"app": "More (“Más”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Thumbtack user guidelines.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Pautas para usuarios de Thumbtack."
},
{
"k": "ui",
"en": "My business isn't shown here",
"es": "Mi negocio no se muestra aquí",
"app": "My business isn't shown here (“Mi negocio no se muestra aquí”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "New",
"es": "Nuevo",
"app": "New (“Nuevo”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Next",
"es": "Siguiente",
"app": "Next (“Siguiente”)",
"var": "",
"dont": "",
"cxEn": "Button to go to the next setup step.",
"cxEs": "Botón para avanzar al siguiente paso en la configuración."
},
{
"k": "ui",
"en": "No hire",
"es": "No contratado",
"app": "No hire (“No contratado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "None",
"es": "Ninguno",
"app": "None (“Ninguno”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create a webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear un webhook."
},
{
"k": "ui",
"en": "Not available",
"es": "No disponible",
"app": "Not available (“No disponible”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los prospectos de Smart Match."
},
{
"k": "ui",
"en": "Not now",
"es": "Ahora no",
"app": "Not now (“Ahora no”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up direct deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar el depósito directo."
},
{
"k": "ui",
"en": "Not scheduled yet",
"es": "Aún no programado",
"app": "Not scheduled yet (“Aún no programado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "Not what I do",
"es": "No es lo que hago",
"app": "Not what I do (“No es lo que hago”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los prospectos de Smart Match."
},
{
"k": "ui",
"en": "Notification settings",
"es": "Configuración de notificaciones",
"app": "Notification settings (“Configuración de notificaciones”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to update notifications.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo actualizar las notificaciones."
},
{
"k": "ui",
"en": "Notifications",
"es": "Notificaciones",
"app": "Notifications (“Notificaciones”)",
"var": "",
"dont": "",
"cxEn": "Alerts the user gets by email, text or in the app.",
"cxEs": "Las alertas que usted recibe por correo, mensaje de texto o en la aplicación."
},
{
"k": "ui",
"en": "Now",
"es": "Ahora",
"app": "Now (“Ahora”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "OK",
"es": "Aceptar",
"app": "OK (“Aceptar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quote templates.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar plantillas de cotización."
},
{
"k": "ui",
"en": "On",
"es": "Activado",
"app": "On (“Activado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to sign up as a pro.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo registrarse como profesional."
},
{
"k": "ui",
"en": "On a future date",
"es": "En una fecha futura",
"app": "On a future date (“En una fecha futura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "Only picked you",
"es": "Solo lo eligió a usted",
"app": "Only picked you (“Solo lo eligió a usted”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Open leads",
"es": "Prospectos abiertos",
"app": "Open leads (“Prospectos abiertos”)",
"var": "",
"dont": "",
"cxEn": "Another name for Opportunities (depends on the experiment or UX).",
"cxEs": "Otra forma de referirse a Oportunidades (según experimento/UX)."
},
{
"k": "ui",
"en": "Opportunities tab",
"es": "Oportunidades",
"app": "Opportunities tab (“Oportunidades”)",
"var": "",
"dont": "",
"cxEn": "App section where pros find new customers. Write it as: Opportunities (\"Oportunidades\").",
"cxEs": "Sección de la aplicación donde los profesionales encuentran nuevos clientes. Se escribe: Opportunities (“Oportunidades”)."
},
{
"k": "ui",
"en": "Other",
"es": "Otro",
"app": "Other (“Otro”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Overview",
"es": "Resumen",
"app": "Overview (“Resumen”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo funcionan los trabajos de instalación de Moen Flo."
},
{
"k": "ui",
"en": "Paid",
"es": "Pagado",
"app": "Paid (“Pagado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Password",
"es": "Contraseña",
"app": "Password (“Contraseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to update my password.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo actualizar mi contraseña."
},
{
"k": "ui",
"en": "Pause",
"es": "Pausar",
"app": "Pause (“Pausar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to turn your job preferences on or off.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo activar o desactivar sus preferencias de trabajo."
},
{
"k": "ui",
"en": "Pause Leads",
"es": "Pausar prospectos",
"app": "Pause Leads (“Pausar prospectos”)",
"var": "",
"dont": "",
"cxEn": "Temporarily stop getting new leads.",
"cxEs": "Detener temporalmente la recepción de nuevos prospectos."
},
{
"k": "ui",
"en": "Pause this service",
"es": "Pausar este servicio",
"app": "Pause this service (“Pausar este servicio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to turn your job preferences on or off.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo activar o desactivar sus preferencias de trabajo."
},
{
"k": "ui",
"en": "Payments",
"es": "Pagos",
"app": "Payments (“Pagos”)",
"var": "",
"dont": "",
"cxEn": "Profile section to manage billing and payment history.",
"cxEs": "Sección del perfil para gestionar la facturación y el historial de cobros."
},
{
"k": "ui",
"en": "Pending",
"es": "Pendiente",
"app": "Pending (“Pendiente”)",
"var": "",
"dont": "",
"cxEn": "Status of a refund request still waiting for approval.",
"cxEs": "Estado de una solicitud de reembolso que aún espera aprobación."
},
{
"k": "ui",
"en": "Performance",
"es": "Rendimiento",
"app": "Performance (“Rendimiento”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "Photos & Videos",
"es": "Fotos y videos",
"app": "Photos & Videos (“Fotos y videos”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add photos and videos.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar fotos y videos."
},
{
"k": "ui",
"en": "Portfolio",
"es": "Portafolio",
"app": "Portfolio (“Portafolio”)",
"var": "",
"dont": "",
"cxEn": "The collection of photos and videos of the pro's past jobs.",
"cxEs": "La colección de fotos y videos de sus trabajos anteriores."
},
{
"k": "ui",
"en": "Post Prices",
"es": "Publicar precios",
"app": "Post Prices (“Publicar precios”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to price my services.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo establecer el precio de mis servicios."
},
{
"k": "ui",
"en": "Preload my balance",
"es": "Precargar mi saldo",
"app": "Preload my balance (“Precargar mi saldo”)",
"var": "",
"dont": "",
"cxEn": "Add funds to the Thumbtack account in advance.",
"cxEs": "Agregar fondos a su cuenta de Thumbtack por adelantado."
},
{
"k": "ui",
"en": "Preview profile",
"es": "Vista previa del perfil",
"app": "Preview profile (“Vista previa del perfil”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to edit my business profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Como editar el perfil de su negocio."
},
{
"k": "ui",
"en": "Quick Replies",
"es": "Respuestas rápidas",
"app": "Quick Replies (“Respuestas rápidas”)",
"var": "",
"dont": "",
"cxEn": "Saved message templates to reply to customers quickly.",
"cxEs": "Plantillas de mensajes guardados para responder rápidamente a los clientes."
},
{
"k": "ui",
"en": "Reactivate account",
"es": "Reactivar cuenta",
"app": "Reactivate account (“Reactivar cuenta”)",
"var": "",
"dont": "",
"cxEn": "Turn an account back on after it was deactivated or suspended.",
"cxEs": "Volver a habilitar una cuenta que estaba desactivada o suspendida."
},
{
"k": "ui",
"en": "Receipts",
"es": "Recibos",
"app": "Receipts (“Recibos”)",
"var": "",
"dont": "",
"cxEn": "Tab where payment receipts can be viewed and downloaded.",
"cxEs": "Pestaña donde se pueden visualizar y descargar los comprobantes de pago."
},
{
"k": "ui",
"en": "Recent deliveries",
"es": "Envíos recientes",
"app": "Recent deliveries (“Envíos recientes”)",
"var": "",
"dont": "Entregas recientes",
"cxEn": "Tab with the history of data sent.",
"cxEs": "Pestaña que muestra el historial de envíos de datos realizados."
},
{
"k": "ui",
"en": "Refund denied",
"es": "Reembolso rechazado",
"app": "Refund denied (“Reembolso rechazado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to request a refund.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar un reembolso."
},
{
"k": "ui",
"en": "Refund Requested",
"es": "Reembolso solicitado",
"app": "Refund Requested (“Reembolso solicitado”)",
"var": "",
"dont": "",
"cxEn": "Status that shows the refund request was sent.",
"cxEs": "Estado que indica que la solicitud de reembolso ha sido enviada."
},
{
"k": "ui",
"en": "Refunded",
"es": "Reembolsado",
"app": "Refunded (“Reembolsado”)",
"var": "",
"dont": "",
"cxEn": "Status of an approved request credited to the account.",
"cxEs": "Estado de una solicitud aprobada y acreditada a la cuenta."
},
{
"k": "ui",
"en": "Register a new number",
"es": "Registrar un nuevo número",
"app": "Register a new number (“Registrar un nuevo número”)",
"var": "",
"dont": "",
"cxEn": "Button to add a phone number to the account.",
"cxEs": "Botón para añadir un número de teléfono a la cuenta."
},
{
"k": "ui",
"en": "Registered phone numbers",
"es": "Números de teléfono registrados",
"app": "Registered phone numbers (“Números de teléfono registrados”)",
"var": "",
"dont": "",
"cxEn": "Settings section to manage linked phone numbers.",
"cxEs": "Sección de configuración para gestionar los teléfonos vinculados."
},
{
"k": "ui",
"en": "Remove",
"es": "Eliminar",
"app": "Remove (“Eliminar”)",
"var": "\"Eliminar\", same as Delete.",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a service.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar un servicio."
},
{
"k": "ui",
"en": "Remove this service",
"es": "Eliminar este servicio",
"app": "Remove this service (“Eliminar este servicio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a service.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar un servicio."
},
{
"k": "ui",
"en": "Reply",
"es": "Responder",
"app": "Reply (“Responder”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Report",
"es": "Reportar",
"app": "Report (“Reportar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to resolve issues with a customer.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo resolver problemas con un cliente."
},
{
"k": "ui",
"en": "Report a scam or dispute",
"es": "Reportar una estafa o disputa",
"app": "Report a scam or dispute (“Reportar una estafa o disputa”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to resolve issues with a customer.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo resolver problemas con un cliente."
},
{
"k": "ui",
"en": "Request a review",
"es": "Solicitar reseña",
"app": "Request a review (“Solicitar reseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "Reschedule",
"es": "Reprogramar",
"app": "Reschedule (“Reprogramar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to reschedule a booking.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo reprogramar una reserva."
},
{
"k": "ui",
"en": "Resend",
"es": "Reenviar",
"app": "Resend (“Reenviar”)",
"var": "",
"dont": "",
"cxEn": "Button to ask for a new verification code by text.",
"cxEs": "Botón para solicitar un nuevo código de verificación por SMS."
},
{
"k": "ui",
"en": "Respond",
"es": "Responder",
"app": "Respond (“Responder”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a las reseñas."
},
{
"k": "ui",
"en": "Responds Quickly",
"es": "Responde rápidamente",
"app": "Responds Quickly (“Responde rápidamente”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What are search results.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los resultados de búsqueda."
},
{
"k": "ui",
"en": "Responses",
"es": "Respuestas",
"app": "Responses (“Respuestas”)",
"var": "",
"dont": "",
"cxEn": "Tab with technical details about the delivery result.",
"cxEs": "Pestaña con detalles técnicos sobre el resultado del envío."
},
{
"k": "ui",
"en": "Resume estimate or invoice",
"es": "Reanudar cotización o factura",
"app": "Resume estimate or invoice (“Reanudar cotización o factura”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Review a pro",
"es": "Dejar una reseña a un profesional",
"app": "Review a pro (“Dejar una reseña a un profesional”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Content and Review Policy.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Política de Contenido y Reseñas."
},
{
"k": "ui",
"en": "Save",
"es": "Guardar",
"app": "Save (“Guardar”)",
"var": "",
"dont": "",
"cxEn": "Button to save changes.",
"cxEs": "Botón para guardar cambios."
},
{
"k": "ui",
"en": "Save business hours",
"es": "Guardar horario comercial",
"app": "Save business hours (“Guardar horario comercial”)",
"var": "",
"dont": "Guardar horas de trabajo",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Save card",
"es": "Guardar tarjeta",
"app": "Save card (“Guardar tarjeta”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add or remove a credit card.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar o eliminar una tarjeta de crédito."
},
{
"k": "ui",
"en": "Save changes",
"es": "Guardar cambios",
"app": "Save changes (“Guardar cambios”)",
"var": "",
"dont": "",
"cxEn": "Button to confirm and save the updates made.",
"cxEs": "Botón para confirmar y guardar las actualizaciones realizadas."
},
{
"k": "ui",
"en": "Save debit card",
"es": "Guardar tarjeta de débito",
"app": "Save debit card (“Guardar tarjeta de débito”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is instant deposit.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el depósito instantáneo."
},
{
"k": "ui",
"en": "Save Password",
"es": "Guardar contraseña",
"app": "Save Password (“Guardar contraseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to update my password.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo actualizar mi contraseña."
},
{
"k": "ui",
"en": "Save travel area",
"es": "Guardar área de desplazamiento",
"app": "Save travel area (“Guardar área de desplazamiento”)",
"var": "",
"dont": "Guardar área de viaje",
"cxEn": "Button or label in the app. Used in: How to manage my travel areas.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis áreas de desplazamiento."
},
{
"k": "ui",
"en": "Save weekly budget",
"es": "Guardar presupuesto semanal",
"app": "Save weekly budget (“Guardar presupuesto semanal”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to edit my budget.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo editar mi presupuesto."
},
{
"k": "ui",
"en": "Schedule review",
"es": "Programar reseña",
"app": "Schedule review (“Programar reseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "Scheduled",
"es": "Programado",
"app": "Scheduled (“Programado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to keep track of my hires.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo realizar el seguimiento de mis trabajos."
},
{
"k": "ui",
"en": "Search Results",
"es": "Resultados de búsqueda",
"app": "Search Results (“Resultados de búsqueda”)",
"var": "",
"dont": "",
"cxEn": "The list of pros a customer sees when searching for a service.",
"cxEs": "La lista de profesionales que un cliente ve al buscar un servicio."
},
{
"k": "ui",
"en": "Send",
"es": "Enviar",
"app": "Send (“Enviar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Send as new",
"es": "Enviar como nueva",
"app": "Send as new (“Enviar como nueva”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to create estimates and invoices on Thumbtack.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo crear cotizaciones y facturas en Thumbtack."
},
{
"k": "ui",
"en": "Send review request",
"es": "Enviar solicitud de reseña",
"app": "Send review request (“Enviar solicitud de reseña”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to ask for reviews.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar reseñas."
},
{
"k": "ui",
"en": "Send text",
"es": "Enviar mensaje de texto",
"app": "Send text (“Enviar mensaje de texto”)",
"var": "",
"dont": "",
"cxEn": "Button to send the contact details by text message.",
"cxEs": "Botón para remitir los detalles de contacto por mensaje escrito."
},
{
"k": "ui",
"en": "Set to unlimited",
"es": "Establecer como ilimitado",
"app": "Set to unlimited (“Establecer como ilimitado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to edit my budget.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo editar mi presupuesto."
},
{
"k": "ui",
"en": "Set up Action",
"es": "Configurar acción",
"app": "Set up Action (“Configurar acción”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Set up targeting",
"es": "Configurar segmentación",
"app": "Set up targeting (“Configurar segmentación”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to turn your job preferences on or off.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo activar o desactivar sus preferencias de trabajo."
},
{
"k": "ui",
"en": "Settings",
"es": "Configuración",
"app": "Settings (“Configuración”)",
"var": "",
"dont": "",
"cxEn": "Menu to adjust account preferences.",
"cxEs": "Menú para ajustar las preferencias de la cuenta."
},
{
"k": "ui",
"en": "Share",
"es": "Compartir",
"app": "Share (“Compartir”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What are Thumbtack numbers.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué son los números de Thumbtack."
},
{
"k": "ui",
"en": "Sign in",
"es": "Iniciar sesión",
"app": "Sign in (“Iniciar sesión”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use the Thumbtack Community.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar la Comunidad de Thumbtack."
},
{
"k": "ui",
"en": "Sign up",
"es": "Registrarse",
"app": "Sign up (“Registrarse”)",
"var": "",
"dont": "",
"cxEn": "App button to start signing up.",
"cxEs": "Botón en la aplicación para iniciar el proceso de registro."
},
{
"k": "ui",
"en": "Sign up for free",
"es": "Registrarse gratis",
"app": "Sign up for free (“Registrarse gratis”)",
"var": "",
"dont": "",
"cxEn": "Desktop button to create a free account.",
"cxEs": "Botón en la versión de escritorio para crear una cuenta gratuita."
},
{
"k": "ui",
"en": "Sign up or log in",
"es": "Registrarse o iniciar sesión",
"app": "Sign up or log in (“Registrarse o iniciar sesión”)",
"var": "",
"dont": "",
"cxEn": "UI option to create an account or sign in.",
"cxEs": "Opción en la interfaz para crear una cuenta o acceder."
},
{
"k": "ui",
"en": "Smart Match",
"es": "Coincidencia inteligente",
"app": "Smart Match (“Coincidencia inteligente”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to respond to leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo responder a los prospectos."
},
{
"k": "ui",
"en": "Start",
"es": "Comenzar",
"app": "Start (“Comenzar”)",
"var": "",
"dont": "",
"cxEn": "Action button to start the identity verification process.",
"cxEs": "Botón de acción para iniciar el trámite de validación de identidad."
},
{
"k": "ui",
"en": "State",
"es": "Estado",
"app": "State (“Estado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Submit",
"es": "Enviar",
"app": "Submit (“Enviar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business license.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar la licencia de su negocio."
},
{
"k": "ui",
"en": "Success Workshop",
"es": "Taller para el éxito",
"app": "Success Workshop (“Taller para el éxito”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is the Thumbtack Pro Rewards program.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el programa Thumbtack Pro Rewards."
},
{
"k": "ui",
"en": "Switch to business",
"es": "Cambiar a cuenta de profesional",
"app": "Switch to business (“Cambiar a cuenta de profesional”)",
"var": "",
"dont": "Cambiar a cuenta comercial",
"cxEn": "Menu option to switch to the pro view.",
"cxEs": "Opción del menú para cambiar a la vista de profesional."
},
{
"k": "ui",
"en": "Switch to customer",
"es": "Cambiar a cuenta de cliente",
"app": "Switch to customer (“Cambiar a cuenta de cliente”)",
"var": "",
"dont": "",
"cxEn": "Menu option to switch to the customer view.",
"cxEs": "Opción del menú para cambiar a la vista de cliente."
},
{
"k": "ui",
"en": "Take a background check",
"es": "Realizar una verificación de antecedentes",
"app": "Take a background check (“Realizar una verificación de antecedentes”)",
"var": "",
"dont": "",
"cxEn": "Call-to-action button at the end of the text.",
"cxEs": "Botón de llamada a la acción al final del texto."
},
{
"k": "ui",
"en": "Take a photo",
"es": "Tomar una foto",
"app": "Take a photo (“Tomar una foto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my business insurance.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar el seguro de su negocio."
},
{
"k": "ui",
"en": "Test",
"es": "Probar",
"app": "Test (“Probar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "ui",
"en": "Test this webhook",
"es": "Probar este webhook",
"app": "Test this webhook (“Probar este webhook”)",
"var": "",
"dont": "",
"cxEn": "Action to check the information reaches the destination correctly.",
"cxEs": "Acción para validar que la información llega correctamente al destino."
},
{
"k": "ui",
"en": "Track my spending",
"es": "Ver mis gastos",
"app": "Track my spending (“Ver mis gastos”)",
"var": "",
"dont": "rastrear",
"cxEn": "See the history of payments to Thumbtack.",
"cxEs": "Revisar el historial de sus pagos a Thumbtack."
},
{
"k": "ui",
"en": "Travel to customers",
"es": "Voy hasta los clientes",
"app": "Travel to customers (“Voy hasta los clientes”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my travel areas.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mis áreas de desplazamiento."
},
{
"k": "ui",
"en": "Trust and Safety",
"es": "Confianza y seguridad",
"app": "Trust and Safety (“Confianza y seguridad”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: Troubleshooting pro account issues.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Solución de problemas con su cuenta de profesional."
},
{
"k": "ui",
"en": "Turn off",
"es": "Desactivar",
"app": "Turn off (“Desactivar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to turn your job preferences on or off.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo activar o desactivar sus preferencias de trabajo."
},
{
"k": "ui",
"en": "Turn on",
"es": "Activar",
"app": "Turn on (“Activar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to turn your job preferences on or off.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo activar o desactivar sus preferencias de trabajo."
},
{
"k": "ui",
"en": "Turn On/Off Preferences",
"es": "Activar/desactivar preferencias",
"app": "Turn On/Off Preferences (“Activar/desactivar preferencias”)",
"var": "",
"dont": "",
"cxEn": "Turn the profile on or off for paid leads.",
"cxEs": "Habilitar o deshabilitar su perfil para recibir prospectos de pago."
},
{
"k": "ui",
"en": "Unblock this time",
"es": "Desbloquear este horario",
"app": "Unblock this time (“Desbloquear este horario”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Undo",
"es": "Deshacer",
"app": "Undo (“Deshacer”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to reach out to Opportunities.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo contactar las oportunidades."
},
{
"k": "ui",
"en": "Unsubscribe from all emails",
"es": "Cancelar suscripción a todos los correos electrónicos",
"app": "Unsubscribe from all emails (“Cancelar suscripción a todos los correos electrónicos”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to unsubscribe.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo cancelar las notificaciones."
},
{
"k": "ui",
"en": "Unsubscribe from all SMS",
"es": "Cancelar suscripción a todos los mensajes de texto",
"app": "Unsubscribe from all SMS (“Cancelar suscripción a todos los mensajes de texto”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to unsubscribe.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo cancelar las notificaciones."
},
{
"k": "ui",
"en": "Update",
"es": "Actualizar",
"app": "Update (“Actualizar”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to import reviews to my Thumbtack profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo importar reseñas a mi perfil de Thumbtack."
},
{
"k": "ui",
"en": "Update prices",
"es": "Actualizar precios",
"app": "Update prices (“Actualizar precios”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to price my services.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo establecer el precio de mis servicios."
},
{
"k": "ui",
"en": "Upload",
"es": "Subir",
"app": "Upload (“Subir”)",
"var": "Always \"Subir\" (Upload image = \"Subir imagen\").",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to add photos and videos.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo agregar fotos y videos."
},
{
"k": "ui",
"en": "Upload image",
"es": "Subir imagen",
"app": "Upload image (“Subir imagen”)",
"var": "",
"dont": "Cargar imagen",
"cxEn": "Button or label in the app. Used in: How to request a refund.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar un reembolso."
},
{
"k": "ui",
"en": "Use any open day or time",
"es": "Usar cualquier día u hora disponible",
"app": "Use any open day or time (“Usar cualquier día u hora disponible”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to manage my availability.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo administrar mi disponibilidad."
},
{
"k": "ui",
"en": "Use your quick reply",
"es": "Usar su respuesta rápida",
"app": "Use your quick reply (“Usar su respuesta rápida”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to use quick replies.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo utilizar respuestas rápidas."
},
{
"k": "ui",
"en": "View business insights",
"es": "Ver estadísticas del negocio",
"app": "View business insights (“Ver estadísticas del negocio”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to view my Performance dashboard.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo ver mi panel de rendimiento."
},
{
"k": "ui",
"en": "View details",
"es": "Ver detalles",
"app": "View details (“Ver detalles”)",
"var": "",
"dont": "",
"cxEn": "Action to see full info about a job or opportunity.",
"cxEs": "Acción para ver la información completa de un trabajo u oportunidad."
},
{
"k": "ui",
"en": "View or share number",
"es": "Ver o compartir número",
"app": "View or share number (“Ver o compartir número”)",
"var": "",
"dont": "",
"cxEn": "Action to see or send the customer's contact details.",
"cxEs": "Acción para visualizar o enviar los datos de contacto del cliente."
},
{
"k": "ui",
"en": "View phone number",
"es": "Ver número de teléfono",
"app": "View phone number (“Ver número de teléfono”)",
"var": "",
"dont": "",
"cxEn": "Button to show the phone number assigned to the customer.",
"cxEs": "Botón para mostrar el contacto telefónico asignado al cliente."
},
{
"k": "ui",
"en": "View your balance and charges",
"es": "Ver su saldo y cargos",
"app": "View your balance and charges (“Ver su saldo y cargos”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to request a refund.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo solicitar un reembolso."
},
{
"k": "ui",
"en": "View your profile as customer",
"es": "Ver su perfil como cliente",
"app": "View your profile as customer (“Ver su perfil como cliente”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to edit my business profile.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Como editar el perfil de su negocio."
},
{
"k": "ui",
"en": "Weekly Budget",
"es": "Presupuesto semanal",
"app": "Weekly Budget (“Presupuesto semanal”)",
"var": "",
"dont": "",
"cxEn": "The spending limit the pro can set for leads.",
"cxEs": "El límite de gasto que puede establecer para los prospectos."
},
{
"k": "ui",
"en": "What customers pay",
"es": "Lo que pagan los clientes",
"app": "What customers pay (“Lo que pagan los clientes”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How to price my services.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo establecer el precio de mis servicios."
},
{
"k": "ui",
"en": "When you're charged",
"es": "Cuándo se le cobra",
"app": "When you're charged (“Cuándo se le cobra”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: How my card is charged for leads.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo se cobran los prospectos en mi tarjeta."
},
{
"k": "ui",
"en": "Your path to Top Pro",
"es": "Su camino para ser profesional destacado",
"app": "Your path to Top Pro (“Su camino para ser profesional destacado”)",
"var": "",
"dont": "",
"cxEn": "Button or label in the app. Used in: What is the Thumbtack Pro Rewards program.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: ¿Qué es el programa Thumbtack Pro Rewards."
},
{
"k": "ui",
"en": "Zip",
"es": "Código postal",
"app": "Zip (“Código postal”)",
"var": "",
"dont": "código ZIP",
"cxEn": "Button or label in the app. Used in: How to set up a Zapier webhook.",
"cxEs": "Botón o etiqueta de la aplicación. Se usa en: Cómo configurar un webhook en Zapier."
},
{
"k": "term",
"en": "Access code",
"es": "código de acceso",
"app": "",
"var": "",
"dont": "",
"cxEn": "7-digit code used to connect calls from unregistered numbers.",
"cxEs": "Código de 7 dígitos para conectar llamadas desde números no registrados."
},
{
"k": "term",
"en": "Account",
"es": "cuenta",
"app": "Account (“Cuenta”)",
"var": "\"cuenta\". Pro account: \"cuenta de profesional\". Customer account: \"cuenta de cliente\".",
"dont": "",
"cxEn": "The pro's Thumbtack account.",
"cxEs": "Su cuenta de profesional en Thumbtack."
},
{
"k": "term",
"en": "account owner",
"es": "dueño de la cuenta",
"app": "",
"var": "",
"dont": "",
"cxEn": "Person responsible for managing the account and keeping it compliant.",
"cxEs": "Persona responsable de la administración y cumplimiento de la cuenta."
},
{
"k": "term",
"en": "Add-ons",
"es": "servicios adicionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Optional services at an extra cost. Casual alternative: \"extras\".",
"cxEs": "Servicios opcionales con costo extra. Alternativa coloquial: 'extras'."
},
{
"k": "term",
"en": "alerts",
"es": "alertas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Notifications that tell the user about activity on their account.",
"cxEs": "Notificaciones que informan al usuario sobre actividad en su cuenta."
},
{
"k": "term",
"en": "app store",
"es": "tienda de aplicaciones",
"app": "",
"var": "",
"dont": "",
"cxEn": "Digital store where the mobile app is downloaded.",
"cxEs": "Plataforma digital donde se descarga la aplicación móvil."
},
{
"k": "term",
"en": "Application Programming Interface (API)",
"es": "interfaz de programación de aplicaciones (API)",
"app": "",
"var": "",
"dont": "",
"cxEn": "Technical integration that automates tasks between systems.",
"cxEs": "Integración técnica para automatizar funciones entre sistemas."
},
{
"k": "term",
"en": "Authorized Agent",
"es": "agente autorizado",
"app": "",
"var": "",
"dont": "",
"cxEn": "A person a user names to make privacy rights requests on their behalf.",
"cxEs": "Una persona designada por un usuario para hacer solicitudes de derechos de privacidad en su nombre."
},
{
"k": "term",
"en": "auto-updates",
"es": "actualizaciones automáticas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Device feature that keeps the app on its latest version.",
"cxEs": "Función del dispositivo para mantener la aplicación en su versión más reciente."
},
{
"k": "term",
"en": "automated lead response service",
"es": "servicio automatizado de respuesta a prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Description of the product's main technical function.",
"cxEs": "Descripción de la función técnica principal del producto."
},
{
"k": "term",
"en": "Availability",
"es": "disponibilidad",
"app": "",
"var": "",
"dont": "",
"cxEn": "The days and hours the pro marks as available to work.",
"cxEs": "Los días y horas que usted marca como disponibles para trabajar."
},
{
"k": "term",
"en": "Background Check",
"es": "verificación de antecedentes",
"app": "Background Check (“Verificación de antecedentes”)",
"var": "",
"dont": "",
"cxEn": "The process to check a pro's background.",
"cxEs": "El proceso para verificar los antecedentes de un profesional."
},
{
"k": "term",
"en": "background check badge",
"es": "distintivo de verificación de antecedentes",
"app": "",
"var": "",
"dont": "",
"cxEn": "Badge that shows on the profile after passing the check.",
"cxEs": "Insignia visual que aparece en el perfil tras aprobar la revisión."
},
{
"k": "term",
"en": "Base Price",
"es": "precio base",
"app": "",
"var": "",
"dont": "",
"cxEn": "The standard amount the pro charges for a service.",
"cxEs": "La cantidad estándar que usted cobra por un servicio."
},
{
"k": "term",
"en": "Behavioral Targeted Advertising",
"es": "publicidad basada en el comportamiento",
"app": "",
"var": "",
"dont": "",
"cxEn": "Ads that use a user's online behavior to show personalized ads.",
"cxEs": "Publicidad que usa datos del comportamiento en línea de un usuario para mostrar anuncios personalizados."
},
{
"k": "term",
"en": "Block Time",
"es": "bloquear horario",
"app": "",
"var": "",
"dont": "bloquear tiempo",
"cxEn": "Mark a period on the calendar as unavailable.",
"cxEs": "Marcar un periodo en su calendario como no disponible."
},
{
"k": "term",
"en": "budget",
"es": "presupuesto",
"app": "",
"var": "",
"dont": "",
"cxEn": "Weekly spending limit for getting leads.",
"cxEs": "Límite de gasto semanal para la obtención de prospectos."
},
{
"k": "term",
"en": "Business Hours",
"es": "horario comercial",
"app": "",
"var": "",
"dont": "",
"cxEn": "The hours of operation the pro shows on their profile.",
"cxEs": "Las horas de atención que usted muestra en su perfil."
},
{
"k": "term",
"en": "business profiles",
"es": "perfiles de negocio",
"app": "business profiles (“Perfiles de negocio”)",
"var": "",
"dont": "",
"cxEn": "Business accounts a pro manages on Thumbtack.",
"cxEs": "Cuentas de empresa que un profesional gestiona en Thumbtack."
},
{
"k": "term",
"en": "Calendar Sync",
"es": "sincronización de calendario",
"app": "",
"var": "",
"dont": "",
"cxEn": "Connecting a personal calendar (e.g. Google) with Thumbtack.",
"cxEs": "Conectar su calendario personal (por ejemplo, Google) con Thumbtack."
},
{
"k": "term",
"en": "Cancellation fee",
"es": "cargo por cancelación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Fee charged when the pro cancels a claimed job outside the allowed time. Multi-word match: wins over Fee.",
"cxEs": "Cargo que se cobra cuando el profesional cancela un trabajo reclamado fuera del plazo permitido. Multi-palabra: gana sobre Fee."
},
{
"k": "term",
"en": "Category",
"es": "categoría",
"app": "",
"var": "",
"dont": "",
"cxEn": "The general service area the pro offers (e.g. \"Home improvement\").",
"cxEs": "El área general de servicio que usted ofrece (por ejemplo, \"Mejoras del hogar\")."
},
{
"k": "term",
"en": "CCPA (California Consumer Privacy Act)",
"es": "CCPA (Ley de Privacidad del Consumidor de California)",
"app": "",
"var": "",
"dont": "",
"cxEn": "California law that gives consumers rights over their personal information.",
"cxEs": "Ley de California que otorga a los consumidores derechos sobre su información personal."
},
{
"k": "term",
"en": "Chargeback Protection",
"es": "Protección contra Contracargos",
"app": "",
"var": "",
"dont": "",
"cxEn": "A policy that protects the pro if a customer disputes a payment made through Thumbtack Pay.",
"cxEs": "Una política que protege al profesional si un cliente disputa un pago hecho a través de Thumbtack Pay."
},
{
"k": "term",
"en": "Claimable Jobs",
"es": "trabajos disponibles para reclamar",
"app": "",
"var": "",
"dont": "reclamables",
"cxEn": "Available projects in the pro's area that they can claim if interested.",
"cxEs": "Proyectos disponibles en su área que puede reclamar si le interesan."
},
{
"k": "term",
"en": "Code of Conduct",
"es": "Código de Conducta",
"app": "",
"var": "",
"dont": "",
"cxEn": "The behavior expected from pros and customers on the platform.",
"cxEs": "Las expectativas de comportamiento para profesionales y clientes en la plataforma."
},
{
"k": "term",
"en": "Community Top Voice",
"es": "voz destacada de la comunidad",
"app": "",
"var": "",
"dont": "",
"cxEn": "Recognition for the most active and helpful pros in the community.",
"cxEs": "Reconocimiento a los profesionales más activos y útiles en la comunidad."
},
{
"k": "term",
"en": "Community Top Voices",
"es": "voces destacadas de la comunidad",
"app": "",
"var": "",
"dont": "",
"cxEn": "Plural of Community Top Voice.",
"cxEs": "Plural de Community Top Voice."
},
{
"k": "term",
"en": "Confirmation letter",
"es": "carta de confirmación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Document (usually from the bank) that confirms an action, like withdrawing a dispute.",
"cxEs": "Documento (generalmente del banco) que verifica una acción, como retirar una disputa."
},
{
"k": "term",
"en": "Content and Review Policy",
"es": "Política de Contenido y Reseñas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Thumbtack's rules on what can be posted in reviews and profiles.",
"cxEs": "Las reglas de Thumbtack sobre lo que se puede publicar en reseñas y perfiles."
},
{
"k": "term",
"en": "Copyright Policy",
"es": "Política de Derechos de Autor",
"app": "",
"var": "",
"dont": "",
"cxEn": "Rules about using protected material (photos, text).",
"cxEs": "Las reglas sobre el uso de material protegido (fotos, textos)."
},
{
"k": "term",
"en": "Cost of Materials",
"es": "costo de materiales",
"app": "",
"var": "",
"dont": "",
"cxEn": "What the materials needed for a job cost.",
"cxEs": "El gasto en los materiales necesarios para realizar un trabajo."
},
{
"k": "term",
"en": "Courtesy credit",
"es": "crédito de cortesía",
"app": "",
"var": "",
"dont": "",
"cxEn": "Credit given at Thumbtack's discretion for situations the policy doesn't cover.",
"cxEs": "Crédito otorgado discrecionalmente por situaciones no cubiertas por la política."
},
{
"k": "term",
"en": "CPA (Colorado Privacy Act)",
"es": "CPA (Ley de Privacidad de Colorado)",
"app": "",
"var": "",
"dont": "",
"cxEn": "Colorado law that gives consumers rights over their personal data.",
"cxEs": "Ley de Colorado que otorga a los consumidores derechos sobre sus datos personales."
},
{
"k": "term",
"en": "Credit package",
"es": "paquete de créditos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Prepaid purchase of credits to get leads on the platform.",
"cxEs": "Compra prepagada de créditos para adquirir prospectos en la plataforma."
},
{
"k": "term",
"en": "Credits",
"es": "créditos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Credits Thumbtack gives for promotions or refunds.",
"cxEs": "Créditos que Thumbtack otorga por promociones o reembolsos."
},
{
"k": "term",
"en": "criminal background check",
"es": "verificación de antecedentes penales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Review of criminal records done by an accredited third-party provider.",
"cxEs": "Revisión de antecedentes penales realizada por un proveedor externo acreditado."
},
{
"k": "term",
"en": "CTDPA (Connecticut Data Privacy Act)",
"es": "CTDPA (Ley de Privacidad de Datos de Connecticut)",
"app": "",
"var": "",
"dont": "",
"cxEn": "Connecticut law that governs how personal data is collected and used.",
"cxEs": "Ley de Connecticut que rige la recopilación y uso de datos personales."
},
{
"k": "term",
"en": "customer",
"es": "cliente",
"app": "",
"var": "",
"dont": "",
"cxEn": "User who looks for and hires pros for their projects.",
"cxEs": "Usuario que busca y contrata profesionales para sus proyectos."
},
{
"k": "term",
"en": "customer account",
"es": "cuenta de cliente",
"app": "",
"var": "",
"dont": "",
"cxEn": "Account used by people who want to hire pros.",
"cxEs": "Cuenta utilizada por usuarios que buscan contratar profesionales."
},
{
"k": "term",
"en": "Customer Relationship Management (CRM)",
"es": "gestión de relaciones con clientes (CRM)",
"app": "",
"var": "",
"dont": "",
"cxEn": "External customer management system integrated with the platform.",
"cxEs": "Sistema externo de gestión de clientes integrado con la plataforma."
},
{
"k": "term",
"en": "Customers",
"es": "clientes",
"app": "",
"var": "",
"dont": "",
"cxEn": "The people who look for pros for their projects.",
"cxEs": "Las personas que buscan profesionales para sus proyectos."
},
{
"k": "term",
"en": "Data Privacy Laws",
"es": "leyes de privacidad de datos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Laws that regulate how organizations handle personal information.",
"cxEs": "Leyes que regulan cómo las organizaciones manejan la información personal."
},
{
"k": "term",
"en": "Direct Deposit",
"es": "depósito directo",
"app": "",
"var": "",
"dont": "",
"cxEn": "Getting earnings sent straight to a bank account.",
"cxEs": "Recibir sus ganancias directamente en su cuenta bancaria."
},
{
"k": "term",
"en": "Direct Leads",
"es": "prospectos directos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Customers who choose this pro specifically and contact them directly.",
"cxEs": "Clientes que lo eligen específicamente a usted y lo contactan directamente."
},
{
"k": "term",
"en": "Disputed charges",
"es": "cargos disputados",
"app": "",
"var": "",
"dont": "",
"cxEn": "Charges a customer has reported to their bank as not valid.",
"cxEs": "Cargos que un cliente ha reclamado a su banco como no válidos."
},
{
"k": "term",
"en": "Earnings",
"es": "ganancias",
"app": "Earnings (“Ganancias”)",
"var": "",
"dont": "",
"cxEn": "The money the pro gets from customers for completed jobs.",
"cxEs": "El dinero que usted recibe de sus clientes por los trabajos realizados."
},
{
"k": "term",
"en": "Estimate",
"es": "cotización aproximada",
"app": "",
"var": "Price estimate in general: \"cotización aproximada\". The document in the invoicing tool (\"Create estimate or invoice\"): \"cotización\".",
"dont": "",
"cxEn": "An approximate price based on the customer's first details.",
"cxEs": "Un precio aproximado basado en los detalles iniciales del cliente."
},
{
"k": "term",
"en": "Fee",
"es": "cargo",
"app": "",
"var": "Penalty (cancellation, no-show): \"cargo\". Lead fees: \"cargos por prospectos\". Flat Fee is a price: \"tarifa fija\".",
"dont": "tarifa (for penalties)",
"cxEn": "Amount charged to the pro as a penalty (cancellation, no-show). Don't use \"tarifa\", which sounds like a price. \"Lead fees\" is still \"cargos por prospectos\". Different from Flat Fee (\"tarifa fija\").",
"cxEs": "Monto que se le cobra al profesional como penalidad (cancelación, inasistencia). No usar 'tarifa', que suena a precio. 'Lead fees' sigue siendo 'cargos por prospectos'. Distinto de Flat Fee (tarifa fija)."
},
{
"k": "term",
"en": "Flat Fee",
"es": "tarifa fija",
"app": "",
"var": "",
"dont": "",
"cxEn": "A single, total price for a defined service.",
"cxEs": "Un precio único y total para un servicio definido."
},
{
"k": "term",
"en": "form",
"es": "formulario",
"app": "",
"var": "",
"dont": "",
"cxEn": "Digital document to request changes to the account or service.",
"cxEs": "Documento digital para solicitar cambios en la cuenta o servicio."
},
{
"k": "term",
"en": "Fraud and Damage Policy",
"es": "Política de Fraude y Daños",
"app": "",
"var": "",
"dont": "",
"cxEn": "What Thumbtack covers in case of fraud or property damage.",
"cxEs": "Lo que cubre Thumbtack en caso de fraude o daños materiales."
},
{
"k": "term",
"en": "GDPR (General Data Protection Regulation)",
"es": "GDPR (Reglamento General de Protección de Datos)",
"app": "",
"var": "",
"dont": "",
"cxEn": "European Union regulation on data protection.",
"cxEs": "Regulación de la Unión Europea sobre protección de datos."
},
{
"k": "term",
"en": "Guidelines",
"es": "pautas",
"app": "",
"var": "",
"dont": "directrices",
"cxEn": "Platform rules and recommendations. The corpus uses \"pautas\"; avoid \"directrices\".",
"cxEs": "Reglas y recomendaciones de la plataforma. El corpus usa 'pautas'; evitar 'directrices'."
},
{
"k": "term",
"en": "Help Center",
"es": "Centro de Ayuda",
"app": "",
"var": "",
"dont": "",
"cxEn": "The collection of all our support articles and guides.",
"cxEs": "La colección de todos nuestros artículos y guías de soporte."
},
{
"k": "term",
"en": "Hourly Rate",
"es": "tarifa por hora",
"app": "",
"var": "",
"dont": "",
"cxEn": "A price set for each hour of work.",
"cxEs": "Un precio fijado por cada hora de trabajo."
},
{
"k": "term",
"en": "Instant Deposit",
"es": "depósito instantáneo",
"app": "",
"var": "",
"dont": "",
"cxEn": "A service to get funds faster, often for a small fee.",
"cxEs": "Un servicio para recibir sus fondos más rápido, a menudo con un pequeño cargo."
},
{
"k": "term",
"en": "integration",
"es": "integración",
"app": "",
"var": "",
"dont": "",
"cxEn": "Technical connection between Thumbtack and an outside app.",
"cxEs": "Conexión técnica entre Thumbtack y una aplicación externa."
},
{
"k": "term",
"en": "Job Types",
"es": "tipos de trabajo",
"app": "Job Types (“Tipos de trabajo”)",
"var": "",
"dont": "",
"cxEn": "The specific jobs within a service (e.g. \"Interior painting\").",
"cxEs": "Los trabajos específicos dentro de un servicio (por ejemplo, \"Pintar interiores\")."
},
{
"k": "term",
"en": "jobs",
"es": "trabajos",
"app": "jobs (“Trabajos”)",
"var": "Tab in the app: Jobs (“Trabajos”). Normal word: \"trabajos\".",
"dont": "",
"cxEn": "Hired services or tasks assigned to a pro.",
"cxEs": "Servicios contratados o tareas asignadas a un profesional."
},
{
"k": "term",
"en": "Law Enforcement Requests",
"es": "solicitudes de las autoridades",
"app": "",
"var": "",
"dont": "",
"cxEn": "Requests for information from the police or government agencies.",
"cxEs": "Peticiones de información por parte de la policía u organismos oficiales."
},
{
"k": "term",
"en": "lead",
"es": "prospecto",
"app": "",
"var": "",
"dont": "",
"cxEn": "Potential customer interested in hiring a pro.",
"cxEs": "Cliente potencial interesado en contratar los servicios de un profesional."
},
{
"k": "term",
"en": "lead credit",
"es": "crédito para prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Singular of lead credits.",
"cxEs": "Singular de lead credits."
},
{
"k": "term",
"en": "lead credits",
"es": "créditos para prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Credits applied to the cost of leads. Multi-word match: wins over Credits.",
"cxEs": "Créditos que se aplican al costo de los prospectos. Multi-palabra: gana sobre Credits."
},
{
"k": "term",
"en": "lead insights",
"es": "información de prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Data about leads: how many come in, competition and trends. Direct translation. Not the Insights section (now Performance Dashboard). Multi-word match: wins over the single term Insights.",
"cxEs": "Datos sobre los prospectos: cuántos llegan, competencia y tendencias. Traducción directa. No confundir con la sección Insights (hoy Performance Dashboard, \"panel de rendimiento\"). Coincidencia multipalabra: tiene prioridad sobre el término suelto Insights."
},
{
"k": "term",
"en": "lead price",
"es": "precio del prospecto",
"app": "",
"var": "",
"dont": "",
"cxEn": "The exact amount the pro pays for each lead.",
"cxEs": "Monto exacto que el profesional paga por cada contacto de cliente potencial."
},
{
"k": "term",
"en": "Lead prices",
"es": "precios de los prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "General phrase for how much the pro pays for leads.",
"cxEs": "Frase en texto general para hablar de cuánto paga por prospectos."
},
{
"k": "term",
"en": "Leads",
"es": "prospectos",
"app": "Leads (“Prospectos”)",
"var": "Tab in the app: Leads (“Prospectos”). Normal word: \"prospectos\".",
"dont": "",
"cxEn": "Potential customers who match the pro's job preferences.",
"cxEs": "Clientes potenciales que coinciden con sus preferencias de trabajo."
},
{
"k": "term",
"en": "License",
"es": "licencia",
"app": "",
"var": "",
"dont": "",
"cxEn": "The professional license the pro can add to their profile to build trust.",
"cxEs": "La licencia profesional que puede agregar a su perfil para generar confianza."
},
{
"k": "term",
"en": "Linked account",
"es": "cuenta vinculada",
"app": "",
"var": "",
"dont": "",
"cxEn": "An account our system has identified as connected to another one.",
"cxEs": "Una cuenta que nuestro sistema ha identificado como conectada a otra."
},
{
"k": "term",
"en": "Login Information",
"es": "información de inicio de sesión",
"app": "",
"var": "",
"dont": "",
"cxEn": "The email and password used to access Thumbtack.",
"cxEs": "Su correo electrónico y contraseña para acceder a Thumbtack."
},
{
"k": "term",
"en": "magic link",
"es": "magic link",
"app": "",
"var": "",
"dont": "",
"cxEn": "Secure link sent by email to log in without a password.",
"cxEs": "Enlace seguro enviado por correo para acceder sin contraseña."
},
{
"k": "term",
"en": "Max lead prices",
"es": "precios máximos por prospecto",
"app": "",
"var": "",
"dont": "",
"cxEn": "The highest price the pro is willing to pay for a type of lead.",
"cxEs": "El precio máximo que usted está dispuesto a pagar por un tipo de prospecto."
},
{
"k": "term",
"en": "Message",
"es": "mensaje",
"app": "",
"var": "",
"dont": "",
"cxEn": "Written communication with customers through the platform.",
"cxEs": "La comunicación escrita con clientes a través de la plataforma."
},
{
"k": "term",
"en": "messages",
"es": "mensajes",
"app": "messages (“Mensajes”)",
"var": "",
"dont": "",
"cxEn": "Direct communication between the customer and the pro in the app.",
"cxEs": "Comunicación directa entre el cliente y el profesional dentro de la aplicación."
},
{
"k": "term",
"en": "monthly subscription",
"es": "suscripción mensual",
"app": "",
"var": "",
"dont": "",
"cxEn": "Recurring monthly charge for using the tool.",
"cxEs": "Modelo de cobro recurrente cada mes por el uso de la herramienta."
},
{
"k": "term",
"en": "No-show",
"es": "inasistencia",
"app": "",
"var": "",
"dont": "",
"cxEn": "When the pro (or the customer: \"customer no-show\") doesn't show up to a scheduled job.",
"cxEs": "Cuando el profesional (o el cliente: 'inasistencia del cliente') no se presenta a un trabajo programado."
},
{
"k": "term",
"en": "No-show fee",
"es": "cargo por inasistencia",
"app": "",
"var": "",
"dont": "",
"cxEn": "Fee charged when the pro doesn't show up to a job they claimed. Multi-word match: wins over Fee.",
"cxEs": "Cargo que se cobra cuando el profesional no se presenta a un trabajo que reclamó. Multi-palabra: gana sobre Fee."
},
{
"k": "term",
"en": "Non-Discrimination Policy",
"es": "Política de No Discriminación",
"app": "",
"var": "",
"dont": "",
"cxEn": "The strict ban on any kind of discrimination.",
"cxEs": "La prohibición estricta de cualquier tipo de discriminación."
},
{
"k": "term",
"en": "Opportunities",
"es": "oportunidades",
"app": "Opportunities (“Oportunidades”)",
"var": "Tab in the app: Opportunities (“Oportunidades”). Normal word: \"oportunidades\".",
"dont": "",
"cxEn": "Available projects that may not match the pro's preferences exactly.",
"cxEs": "Proyectos disponibles que pueden no coincidir exactamente con sus preferencias."
},
{
"k": "term",
"en": "Opt-Out",
"es": "exclusión voluntaria",
"app": "",
"var": "",
"dont": "optar por excluirse",
"cxEn": "Choosing not to allow personal information to be sold or shared.",
"cxEs": "El acto de elegir que no se venda ni se comparta su información personal."
},
{
"k": "term",
"en": "Outstanding balance",
"es": "saldo pendiente",
"app": "",
"var": "",
"dont": "",
"cxEn": "An amount of money the pro owes Thumbtack.",
"cxEs": "Una cantidad de dinero que usted le debe a Thumbtack."
},
{
"k": "term",
"en": "partner tool",
"es": "herramienta de socios",
"app": "",
"var": "",
"dont": "",
"cxEn": "Outside apps that have an official partnership with Thumbtack.",
"cxEs": "Aplicaciones externas que tienen una colaboración oficial con Thumbtack."
},
{
"k": "term",
"en": "Partner Tools",
"es": "herramientas de socios",
"app": "",
"var": "",
"dont": "",
"cxEn": "Integrations with other platforms (e.g. GoSite).",
"cxEs": "Integraciones con otras plataformas (por ejemplo, GoSite)."
},
{
"k": "term",
"en": "payment history",
"es": "historial de pagos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Detailed record of all the pro's transactions and spending.",
"cxEs": "Registro detallado de todas las transacciones y gastos realizados por el profesional."
},
{
"k": "term",
"en": "Payment Information",
"es": "información de pago",
"app": "",
"var": "",
"dont": "",
"cxEn": "Financial details like credit card or bank account numbers.",
"cxEs": "Detalles financieros como números de tarjeta de crédito o cuentas bancarias."
},
{
"k": "term",
"en": "payment method",
"es": "método de pago",
"app": "",
"var": "",
"dont": "",
"cxEn": "Saved credit or debit card used for future charges.",
"cxEs": "Tarjeta de crédito o débito guardada para realizar los cobros futuros."
},
{
"k": "term",
"en": "Performance Dashboard",
"es": "panel de rendimiento",
"app": "Performance Dashboard (“Panel de rendimiento”)",
"var": "",
"dont": "",
"cxEn": "The section where the pro reviews their stats (views, responses, etc.).",
"cxEs": "La sección donde usted analiza sus estadísticas (vistas, respuestas, etc.)."
},
{
"k": "term",
"en": "Personal Information",
"es": "información personal",
"app": "",
"var": "",
"dont": "",
"cxEn": "Any data that can identify a person.",
"cxEs": "Cualquier dato que permita identificar a una persona."
},
{
"k": "term",
"en": "Phone Number Guarantee",
"es": "Garantía de número de teléfono",
"app": "",
"var": "",
"dont": "",
"cxEn": "Makes sure the pro can reach the customer they paid for.",
"cxEs": "Asegura que el profesional pueda ponerse en contacto con el cliente pagado."
},
{
"k": "term",
"en": "plan",
"es": "plan",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service options with different price levels and features.",
"cxEs": "Opciones de servicio con distintos niveles de precio y funciones."
},
{
"k": "term",
"en": "Policies",
"es": "políticas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Thumbtack's official rules on specific topics.",
"cxEs": "Las normas oficiales de Thumbtack sobre temas específicos."
},
{
"k": "term",
"en": "Price Range",
"es": "rango de precios",
"app": "",
"var": "",
"dont": "",
"cxEn": "A minimum and maximum price for complex jobs.",
"cxEs": "Un precio mínimo y máximo para trabajos complejos."
},
{
"k": "term",
"en": "Privacy Policy",
"es": "Política de Privacidad",
"app": "",
"var": "",
"dont": "",
"cxEn": "The document that explains how we handle and protect user data.",
"cxEs": "El documento que explica cómo manejamos y protegemos sus datos."
},
{
"k": "term",
"en": "pro",
"es": "profesional",
"app": "",
"var": "",
"dont": "",
"cxEn": "Person or business that offers their services on the platform.",
"cxEs": "Persona o empresa que ofrece sus servicios en la plataforma."
},
{
"k": "term",
"en": "pro account",
"es": "cuenta de profesional",
"app": "",
"var": "",
"dont": "",
"cxEn": "Account type for service providers.",
"cxEs": "Tipo de cuenta específica para proveedores de servicios."
},
{
"k": "term",
"en": "Pro API",
"es": "API para profesionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Technical interface for pros' tools.",
"cxEs": "Interfaz técnica específica para las herramientas de los profesionales."
},
{
"k": "term",
"en": "Pro App",
"es": "aplicación Thumbtack Pro",
"app": "",
"var": "",
"dont": "",
"cxEn": "Name of the mobile app for pros. \"Thumbtack Pro\" is not translated.",
"cxEs": "Nombre de la app móvil para profesionales. 'Thumbtack Pro' no se traduce."
},
{
"k": "term",
"en": "Pro Community",
"es": "Comunidad de Thumbtack para profesionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Short form of Thumbtack Pro Community. In Spanish we use the full name so it's clear which community it is.",
"cxEs": "Forma corta de Thumbtack Pro Community. En español se nombra completo para que quede claro de qué comunidad se habla."
},
{
"k": "term",
"en": "profile",
"es": "perfil",
"app": "profile (“Perfil”)",
"var": "",
"dont": "",
"cxEn": "Public page with the pro's information and services.",
"cxEs": "Página pública con la información y servicios del profesional."
},
{
"k": "term",
"en": "Profile Photo",
"es": "foto de perfil",
"app": "",
"var": "",
"dont": "",
"cxEn": "The pro's personal photo that helps customers get to know them.",
"cxEs": "Su foto personal, que ayuda a los clientes a conocerlo."
},
{
"k": "term",
"en": "Project",
"es": "proyecto",
"app": "",
"var": "",
"dont": "",
"cxEn": "The specific need or job a customer posts.",
"cxEs": "La necesidad o trabajo específico que un cliente publica."
},
{
"k": "term",
"en": "Promotional credits",
"es": "créditos promocionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Credits given as an incentive in exchange for a purchase.",
"cxEs": "Créditos recibidos como incentivo a cambio de una compra."
},
{
"k": "term",
"en": "Promotions",
"es": "promociones",
"app": "",
"var": "",
"dont": "",
"cxEn": "Special offers the pro can use to attract customers.",
"cxEs": "Ofertas especiales que puede aplicar para atraer clientes."
},
{
"k": "term",
"en": "pros",
"es": "profesionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Registered specialists or businesses that offer their services.",
"cxEs": "Especialistas o negocios registrados que ofrecen sus servicios."
},
{
"k": "term",
"en": "Push Notifications",
"es": "notificaciones push",
"app": "",
"var": "",
"dont": "",
"cxEn": "Alerts that pop up on the phone screen from the app.",
"cxEs": "Alertas que aparecen directamente en la pantalla de su celular desde la aplicación."
},
{
"k": "term",
"en": "Quality Commitment",
"es": "Compromiso de Calidad",
"app": "",
"var": "",
"dont": "Compromiso de calidad (lowercase)",
"cxEn": "Thumbtack's policies to make sure service quality is high.",
"cxEs": "Las políticas de Thumbtack para asegurar un servicio de calidad."
},
{
"k": "term",
"en": "Quote",
"es": "cotización",
"app": "",
"var": "",
"dont": "",
"cxEn": "The price proposal the pro sends to a lead.",
"cxEs": "La propuesta de precio que usted envía a un prospecto."
},
{
"k": "term",
"en": "Quote Templates",
"es": "plantillas de cotización",
"app": "Quote Templates (“Plantillas de cotización”)",
"var": "",
"dont": "",
"cxEn": "Ready-made quotes to send to customers.",
"cxEs": "Modelos de cotización predefinidos para enviar a los clientes."
},
{
"k": "term",
"en": "Rank",
"es": "posición",
"app": "",
"var": "",
"dont": "",
"cxEn": "The pro's position in search results.",
"cxEs": "Su posición en los resultados de búsqueda."
},
{
"k": "term",
"en": "Ranking",
"es": "clasificación",
"app": "",
"var": "",
"dont": "",
"cxEn": "The order of pros in search results.",
"cxEs": "El ordenamiento de profesionales en los resultados de búsqueda."
},
{
"k": "term",
"en": "ratings",
"es": "calificaciones",
"app": "",
"var": "",
"dont": "",
"cxEn": "Scores customers give pros.",
"cxEs": "Puntuaciones otorgadas por los clientes a los profesionales."
},
{
"k": "term",
"en": "Refer a Pro",
"es": "recomendar a un profesional",
"app": "",
"var": "",
"dont": "",
"cxEn": "Recommending another Thumbtack pro to a customer.",
"cxEs": "Recomendar a otro profesional de Thumbtack a un cliente."
},
{
"k": "term",
"en": "Referral Program",
"es": "Programa de Referidos",
"app": "",
"var": "",
"dont": "",
"cxEn": "The program that rewards pros for bringing new pros to the platform.",
"cxEs": "El programa que lo premia por traer nuevos profesionales a la plataforma."
},
{
"k": "term",
"en": "Refund",
"es": "reembolso",
"app": "",
"var": "Noun: \"reembolso\". Status Refunded: \"Reembolsado\". Request a refund: \"solicitar un reembolso\".",
"dont": "",
"cxEn": "Return of the payment if the customer doesn't respond to the pro.",
"cxEs": "Devolución del pago si el cliente no responde al profesional."
},
{
"k": "term",
"en": "Refunds",
"es": "reembolsos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Money returned for lead payments or services.",
"cxEs": "Devoluciones de dinero por pagos de prospectos o servicios."
},
{
"k": "term",
"en": "Request a refund",
"es": "solicitar un reembolso",
"app": "Request a refund (“Solicitar un reembolso”)",
"var": "",
"dont": "",
"cxEn": "Asking for money back for a lead that didn't meet the criteria.",
"cxEs": "El acto de pedir la devolución del dinero por un prospecto que no cumplió con los criterios."
},
{
"k": "term",
"en": "Request to Delete",
"es": "solicitud de eliminación",
"app": "",
"var": "",
"dont": "",
"cxEn": "A user's right to ask that their personal information be deleted.",
"cxEs": "El derecho de un usuario a solicitar la eliminación de su información personal."
},
{
"k": "term",
"en": "Request to Know",
"es": "solicitud de información",
"app": "",
"var": "",
"dont": "",
"cxEn": "A user's right to ask for a copy of their personal information.",
"cxEs": "El derecho de un usuario a solicitar una copia de su información personal."
},
{
"k": "term",
"en": "Resolve Issues",
"es": "resolver problemas",
"app": "",
"var": "",
"dont": "",
"cxEn": "The process of solving a disagreement or problem with a customer.",
"cxEs": "El proceso de solucionar un desacuerdo o problema con un cliente."
},
{
"k": "term",
"en": "Respond to Leads",
"es": "responder a prospectos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Contacting a potential customer who reached out.",
"cxEs": "La acción de contactar a un cliente potencial que le llegó."
},
{
"k": "term",
"en": "Respond to Reviews",
"es": "responder a reseñas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Writing a public reply to a review the pro got.",
"cxEs": "Escribir una respuesta pública a una reseña que recibió."
},
{
"k": "term",
"en": "Responsible Disclosure",
"es": "Divulgación Responsable",
"app": "",
"var": "",
"dont": "",
"cxEn": "The policy for reporting security vulnerabilities someone finds.",
"cxEs": "La política para reportar vulnerabilidades de seguridad que encuentre."
},
{
"k": "term",
"en": "review",
"es": "reseña",
"app": "",
"var": "Noun, a customer's rating: \"reseña\". Verb, to look something over (\"review your balance\"): \"revisar\" or \"consultar\".",
"dont": "",
"cxEn": "Rating and comment a customer leaves about a pro.",
"cxEs": "Calificación y comentario dejado por los clientes sobre el profesional."
},
{
"k": "term",
"en": "Reviews",
"es": "reseñas",
"app": "Reviews (“Reseñas”)",
"var": "Tab or section in the app: Reviews (“Reseñas”). Normal word: \"reseñas\".",
"dont": "",
"cxEn": "The ratings and comments customers leave on the pro's profile.",
"cxEs": "Las calificaciones y comentarios que los clientes dejan en su perfil."
},
{
"k": "term",
"en": "Sales Tax",
"es": "impuesto sobre las ventas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Tax that may apply to services depending on location.",
"cxEs": "El impuesto que se puede aplicar a los servicios según la ubicación."
},
{
"k": "term",
"en": "Security",
"es": "seguridad",
"app": "",
"var": "",
"dont": "",
"cxEn": "Measures to protect the account, like two-factor authentication.",
"cxEs": "Medidas para proteger su cuenta, como la autenticación de dos factores."
},
{
"k": "term",
"en": "Services",
"es": "servicios",
"app": "Services (“Servicios”)",
"var": "",
"dont": "",
"cxEn": "The different services the pro offers customers.",
"cxEs": "Los diferentes servicios que usted ofrece a los clientes."
},
{
"k": "term",
"en": "setup checklist",
"es": "lista de verificación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Guide with the steps needed to finish setting up the pro account.",
"cxEs": "Guía de pasos necesarios para completar la cuenta del profesional."
},
{
"k": "term",
"en": "SMS Terms",
"es": "Términos de SMS",
"app": "",
"var": "",
"dont": "",
"cxEn": "The terms the user accepts when signing up for Thumbtack text messages.",
"cxEs": "Las condiciones que acepta al suscribirse a los mensajes de texto de Thumbtack."
},
{
"k": "term",
"en": "Starting Price",
"es": "precio inicial",
"app": "",
"var": "",
"dont": "",
"cxEn": "Base price shown in search results; the search UI shows \"Desde\".",
"cxEs": "Precio base visible en los resultados de búsqueda; el buscador muestra 'Desde'."
},
{
"k": "term",
"en": "Support",
"es": "soporte",
"app": "",
"var": "",
"dont": "",
"cxEn": "The customer support team.",
"cxEs": "El equipo/área de atención al cliente."
},
{
"k": "term",
"en": "Suspicious Activity",
"es": "actividad sospechosa",
"app": "",
"var": "",
"dont": "",
"cxEn": "Any behavior that looks fraudulent or breaks the rules.",
"cxEs": "Cualquier comportamiento que parezca fraudulento o que viole las normas."
},
{
"k": "term",
"en": "swag",
"es": "artículos promocionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Branded items (T-shirts, caps, stickers) Thumbtack gives away.",
"cxEs": "Productos de marca (camisetas, gorras, calcomanías) que Thumbtack regala."
},
{
"k": "term",
"en": "Tap",
"es": "Seleccione",
"app": "",
"var": "Mobile app: \"Seleccione X\". Computer: \"Haga clic en X\".",
"dont": "",
"cxEn": "Verb for steps in the mobile app: Tap X = Seleccione X. On desktop: \"Haga clic en\".",
"cxEs": "Verbo para pasos en la aplicación móvil: Tap X = Seleccione X. En computadora: 'Haga clic en'."
},
{
"k": "term",
"en": "targeting",
"es": "segmentación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Technical term for how job preferences are set up.",
"cxEs": "Término técnico referido a la configuración de las preferencias de trabajo."
},
{
"k": "term",
"en": "Terms and Conditions",
"es": "Términos y Condiciones",
"app": "",
"var": "",
"dont": "",
"cxEn": "The full legal contract that governs using the platform.",
"cxEs": "El contrato legal completo que rige el uso de la plataforma."
},
{
"k": "term",
"en": "Terms of Use",
"es": "Términos de Uso",
"app": "",
"var": "",
"dont": "",
"cxEn": "The legal agreement that governs using the Thumbtack platform.",
"cxEs": "El acuerdo legal que rige el uso de la plataforma Thumbtack."
},
{
"k": "term",
"en": "test lead",
"es": "prospecto de prueba",
"app": "",
"var": "",
"dont": "",
"cxEn": "Sample data sent to check that the connection works.",
"cxEs": "Datos de ejemplo enviados para verificar el funcionamiento de la conexión."
},
{
"k": "term",
"en": "Third Party Requests",
"es": "solicitudes de terceros",
"app": "",
"var": "",
"dont": "",
"cxEn": "Requests for information about a user from someone who isn't that user.",
"cxEs": "Peticiones de información sobre un usuario por parte de alguien que no es el usuario."
},
{
"k": "term",
"en": "Thumbtack account",
"es": "cuenta de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "The user's account to access the platform's services.",
"cxEs": "Perfil personal del usuario para acceder a los servicios de la plataforma."
},
{
"k": "term",
"en": "Thumbtack app",
"es": "aplicación Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Mobile app to find and hire pros for projects.",
"cxEs": "Aplicación móvil para buscar y contratar profesionales para proyectos."
},
{
"k": "term",
"en": "Thumbtack balance",
"es": "saldo de Thumbtack",
"app": "Thumbtack balance (“Saldo de Thumbtack”)",
"var": "",
"dont": "",
"cxEn": "Funds available in the pro's account to pay for services.",
"cxEs": "Fondos disponibles en la cuenta del profesional para pagar servicios."
},
{
"k": "term",
"en": "Thumbtack Community",
"es": "Comunidad de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "The forum where pros connect and share tips.",
"cxEs": "El foro para que los profesionales se conecten y compartan consejos."
},
{
"k": "term",
"en": "Thumbtack Guarantee",
"es": "Garantía de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "The protection Thumbtack offers customers if something goes wrong.",
"cxEs": "La protección que Thumbtack ofrece a los clientes en caso de problemas."
},
{
"k": "term",
"en": "Thumbtack Help",
"es": "Centro de Ayuda de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Support site with help articles for users.",
"cxEs": "Portal de soporte con artículos informativos para los usuarios."
},
{
"k": "term",
"en": "Thumbtack messenger",
"es": "chat de Thumbtack",
"app": "",
"var": "Tool: \"chat de Thumbtack\". The conversations: \"mensajes de Thumbtack\". The service in general: \"mensajería de Thumbtack\".",
"dont": "mensajero",
"cxEn": "The tool to send and receive messages on Thumbtack. Varies by context: \"chat de Thumbtack\" for the tool, \"mensajes de Thumbtack\" for the conversations, \"mensajería de Thumbtack\" for the service in general. Don't use \"mensajero\".",
"cxEs": "La herramienta para enviar y recibir mensajes en Thumbtack. Varía según el contexto: 'chat de Thumbtack' cuando se habla de la herramienta, 'mensajes de Thumbtack' cuando se habla de las conversaciones, 'mensajería de Thumbtack' cuando se habla del servicio en general. No usar 'mensajero'."
},
{
"k": "term",
"en": "Thumbtack numbers",
"es": "números de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Feature that gives the pro a permanent number to contact customers.",
"cxEs": "Característica que asigna un número permanente para contactar clientes."
},
{
"k": "term",
"en": "Thumbtack Pro app",
"es": "aplicación Thumbtack Pro",
"app": "",
"var": "\"aplicación Thumbtack Pro\". Short form: \"la aplicación\". Don't add \"de\".",
"dont": "aplicación de Thumbtack Pro",
"cxEn": "Name of the mobile app for pros. \"Thumbtack Pro\" is not translated.",
"cxEs": "Nombre de la aplicación móvil para profesionales. 'Thumbtack Pro' no se traduce."
},
{
"k": "term",
"en": "Thumbtack Pro Community",
"es": "Comunidad de Thumbtack para profesionales",
"app": "",
"var": "",
"dont": "",
"cxEn": "The forum and website where pros connect and share tips. Translated; not a product name.",
"cxEs": "El foro y la página web donde los profesionales se conectan y comparten consejos. Se traduce; no es nombre de producto."
},
{
"k": "term",
"en": "Thumbtack Quality Commitment",
"es": "Compromiso de Calidad de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Guarantee that protects and supports the pro's investment on the platform.",
"cxEs": "Garantía que protege y respalda la inversión del profesional en la plataforma."
},
{
"k": "term",
"en": "Thumbtack swag",
"es": "artículos promocionales de Thumbtack",
"app": "",
"var": "",
"dont": "",
"cxEn": "Same as swag, with the brand named.",
"cxEs": "Igual que swag, con la marca explícita."
},
{
"k": "term",
"en": "Top Pro",
"es": "profesional destacado",
"app": "",
"var": "",
"dont": "Top Pro (in Spanish text)",
"cxEn": "Recognition for the best-performing pros. Translated; not a UI label.",
"cxEs": "Reconocimiento a los profesionales con mejor desempeño. Se traduce; no es una etiqueta de la interfaz."
},
{
"k": "term",
"en": "Top Pro Badge",
"es": "insignia de profesional destacado",
"app": "",
"var": "",
"dont": "",
"cxEn": "Badge top-performing pros receive.",
"cxEs": "Insignia que reciben los profesionales destacados por su desempeño."
},
{
"k": "term",
"en": "Top Pros",
"es": "profesionales destacados",
"app": "",
"var": "",
"dont": "",
"cxEn": "Plural of Top Pro.",
"cxEs": "Plural de Top Pro."
},
{
"k": "term",
"en": "Travel Areas",
"es": "áreas de desplazamiento",
"app": "Travel Areas (“Áreas de desplazamiento”)",
"var": "",
"dont": "áreas de viaje, zonas de desplazamiento",
"cxEn": "The geographic areas where the pro is willing to work.",
"cxEs": "Las áreas geográficas donde usted está dispuesto a trabajar."
},
{
"k": "term",
"en": "trigger",
"es": "disparador",
"app": "",
"var": "",
"dont": "",
"cxEn": "The first event that starts an automation in Zapier.",
"cxEs": "Evento inicial que activa la automatización en Zapier."
},
{
"k": "term",
"en": "Troubleshooting",
"es": "solución de problemas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Steps to fix technical problems with the app or website.",
"cxEs": "Pasos para resolver problemas técnicos con la aplicación o el sitio web."
},
{
"k": "term",
"en": "User Guidelines",
"es": "Pautas para Usuarios",
"app": "",
"var": "",
"dont": "",
"cxEn": "Specific rules on how users should interact on Thumbtack.",
"cxEs": "Normas específicas sobre cómo deben interactuar los usuarios en Thumbtack."
},
{
"k": "term",
"en": "Verification processes",
"es": "procesos de verificación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Steps to confirm a user's identity before handling a request.",
"cxEs": "Pasos para confirmar la identidad de un usuario antes de procesar una solicitud."
},
{
"k": "term",
"en": "webhook",
"es": "webhook",
"app": "",
"var": "",
"dont": "",
"cxEn": "Technical tool that sends information to other apps automatically.",
"cxEs": "Herramienta técnica para enviar información automáticamente a otras aplicaciones."
},
{
"k": "term",
"en": "Weekly spending limit",
"es": "límite de gasto semanal",
"app": "",
"var": "",
"dont": "",
"cxEn": "The total the pro decides to spend per week.",
"cxEs": "Tope total que usted decide gastar por semana."
},
{
"k": "term",
"en": "Weekly targeting budget",
"es": "presupuesto semanal",
"app": "",
"var": "",
"dont": "",
"cxEn": "Setting that controls weekly spending on leads.",
"cxEs": "Ajuste que controla el gasto semanal en prospectos según su configuración."
},
{
"k": "term",
"en": "Withdraw the disputes",
"es": "retirar las disputas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Canceling a payment claim the pro made with their bank.",
"cxEs": "La acción de cancelar un reclamo de pago que usted hizo con su banco."
},
{
"k": "category",
"en": "Accounting or tax professions",
"es": "Contabilidad o preparación de impuestos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Architecture",
"es": "Arquitectura",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Attorney",
"es": "Servicios legales",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Carpentry",
"es": "Carpintería",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Concrete and foundation work",
"es": "Concreto y cimientos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Drywall",
"es": "Instalación y reparación de paneles de yeso",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Electrical work",
"es": "Trabajos eléctricos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Engineers",
"es": "Ingeniería",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Events",
"es": "Eventos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Financial professions",
"es": "Servicios financieros",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Flooring and carpet",
"es": "Pisos y alfombras",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "General contracting",
"es": "Contratistas generales",
"app": "",
"var": "",
"dont": "contratación general",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Home improvement and home building",
"es": "Mejoras y construcción de viviendas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "HVAC work",
"es": "Calefacción, ventilación y aire acondicionado",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Insulation",
"es": "Aislamiento",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Landscaping",
"es": "Jardinería y paisajismo",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Lessons",
"es": "Clases",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Masonry",
"es": "Albañilería",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Metalworking",
"es": "Trabajos en metal",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Moving",
"es": "Mudanzas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Painting",
"es": "Pintura",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Paving",
"es": "Pavimentación",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Pest control applicators",
"es": "Control de plagas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Plumbing",
"es": "Plomería",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Pool and spa",
"es": "Piscinas y spas",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Roofing",
"es": "Techos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Tiling",
"es": "Instalación de azulejos",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
},
{
"k": "category",
"en": "Wellness",
"es": "Bienestar",
"app": "",
"var": "",
"dont": "",
"cxEn": "Service category name shown on Thumbtack.",
"cxEs": "Nombre de una categoría de servicio en Thumbtack."
}
];
