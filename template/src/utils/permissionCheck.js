function permissionCheck(context, handler) {
  const hasRoles = handler.roles && handler.roles.length > 0
  const hasUsers = handler.users && handler.users.length > 0

  if (!hasRoles && !hasUsers) {
    return true;
  }

  let roleCheck = !hasRoles;
  if (hasRoles) {
    let member = null;
    
    if (context.member) {
      member = context.member
    } else if (context.member) {
      member = context.member
    } else if (context.user) {
      member = context.member
    }

    if (!member || !member.roles) {
      roleCheck = false
    } else {
      const memberRoles = member.roles.cache.map(role => role.id);
      roleCheck = handler.roles.some(roleId => memberRoles.includes(roleId))
    }
  }

  let userCheck = !hasUsers
  if (hasUsers) {
    let userId = null
    
    if (context.user?.id) {
      userId = context.user.id
    } else if (context.author?.id) {
      userId = context.author.id
    } else if (context.member?.id) {
      userId = context.member.id
    }
    
    userCheck = handler.users.includes(userId)
  }

  if (hasRoles && hasUsers) {
    return roleCheck && userCheck
  } else if (hasRoles) {
    return roleCheck
  } else if (hasUsers) {
    return userCheck
  }

  return true
}

module.exports = permissionCheck