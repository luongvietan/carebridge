-- European-Portuguese vocabulary per the client's review (30 September): the
-- professional "categorias", not "funções". Only the pt-PT rows change.
update notification_templates
   set body = replace(body, 'compatível com a sua função', 'compatível com a sua categoria')
 where locale = 'pt-PT';
