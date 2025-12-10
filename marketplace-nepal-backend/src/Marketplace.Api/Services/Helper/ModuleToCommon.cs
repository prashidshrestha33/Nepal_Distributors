namespace Marketplace.Api.Services.Helper
{
    public class ModuleToCommon
    {
        public  TTarget Map<TTarget>(object source) where TTarget : new()
        {
            if (source == null) return default;

            TTarget target = new TTarget();

            var sourceProps = source.GetType().GetProperties();
            var targetProps = typeof(TTarget).GetProperties();

            foreach (var sProp in sourceProps)
            {
                var tProp = targetProps.FirstOrDefault(x =>
                    x.Name.Equals(sProp.Name, StringComparison.OrdinalIgnoreCase)
                    && x.CanWrite);

                if (tProp == null) continue;

                var value = sProp.GetValue(source);

                // assign only compatible types
                if (value != null && tProp.PropertyType.IsAssignableFrom(sProp.PropertyType))
                    tProp.SetValue(target, value);
            }

            return target;
        }
    }
}
