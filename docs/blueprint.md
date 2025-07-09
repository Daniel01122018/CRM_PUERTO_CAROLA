# **App Name**: El Puerto de Carola CRM

## Core Features:

- Vista de estado de la mesa: Visualización del estado de las mesas disponibles (10 mesas) con una interfaz intuitiva que indica el estado de cada mesa.
- Toma de pedidos interactiva: Interfaz interactiva para tomar pedidos, permitiendo la selección de platos del menú, incluyendo 'ENCEBOLLADO', 'GUATITA CON ARROZ', etc. Un cajón de 'extras' proporciona complementos opcionales como 'PORCIÓN DE ARROZ', 'CHIFLE', etc. Soporte para notas especiales.
- Gestión de pedidos en tiempo real: Resumen del pedido guardado localmente durante la sesión activa con opciones para finalizarlo. Al finalizar un pedido, se muestra la opción de calcular el cambio a entregar.
- Autenticación segura: Autenticación local para los camareros. Usuarios: Elena (0123456789), Mesero1 (1234567890), admin1 (admin01).
- Sistema de visualización en cocina: Módulo dedicado para mostrar los pedidos activos en la cocina para su preparación.
- Gestión de la base de datos SQLite local: Gestión de la base de datos SQLite que almacena usuarios, pedidos e historial de pedidos.
- Pedidos para llevar: Ubicación estratégica de la función 'Para llevar' que proporciona una experiencia de usuario idéntica a la de la toma de pedidos en mesa.

## Style Guidelines:

- Color primario: Turquesa saturado (#40E0D0) para reflejar la marca establecida del restaurante.
- Color de fondo: Blanco roto (#F0FFFF), un tinte muy claro del turquesa primario, para dar prominencia a los elementos en pantalla.
- Color de acento: Amarillo pálido (#FAFAD2) para asegurar un alto contraste, teniendo en cuenta que esta aplicación se utilizará en tablets, a menudo en condiciones de mucho brillo.
- Fuente del cuerpo y titulares: 'PT Sans' (sans-serif), ya que es apropiada tanto para titulares como para el cuerpo del texto.
- Iconos personalizados que representan diferentes platos y acciones de pedido.
- Diseño limpio y responsivo con botones grandes y navegación sencilla, optimizado para tablets y dispositivos móviles.
- Transiciones sutiles entre los estados de los pedidos y las selecciones del menú.